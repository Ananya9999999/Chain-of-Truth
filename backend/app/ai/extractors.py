"""Deterministic forensic entity extraction.

`services/ai_engine.extract_entities` casts a wide net and produces overlapping,
nested spans ("9:00 PM" and "00 PM"; a LOCATION covering a whole sentence). That
is noise an officer has to wade through, and on a demo screen it reads as the AI
being sloppy.

This module is stricter. Every pattern is anchored, every match is resolved to
exact character offsets, and overlapping matches are reduced to the single best
span so each real-world entity is reported once.

Nothing here guesses. If a pattern does not match, no fact is emitted -- an
absent fact is always better than an invented one.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Confidence reflects how unambiguous the pattern is, not how "sure" a model is.
# A 24-hour timestamp is nearly unambiguous; a capitalised word being a person's
# name is a guess, and is scored like one.
_CONFIDENCE = {
    "TIME": 0.93,
    "DATE": 0.90,
    "PHONE": 0.95,
    "VEHICLE": 0.88,
    "MONEY": 0.88,
    "WEAPON": 0.80,
    "LOCATION": 0.70,
    "PERSON": 0.62,
}

_MONTHS = (
    "January|February|March|April|May|June|July|August|September|October|"
    "November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec"
)

# Words that look like names but are not.
_NOT_NAMES = {
    "The", "This", "That", "There", "Then", "These", "Those", "When", "Where",
    "While", "What", "Which", "Who", "Whom", "After", "Before", "During",
    "Witness", "Statement", "Suspect", "Accused", "Victim", "Deceased",
    "Officer", "Inspector", "Constable", "Sub", "Police", "Station", "Court",
    "Section", "Report", "Evidence", "CCTV", "Camera", "Footage", "According",
    "He", "She", "They", "It", "We", "I", "His", "Her", "Their", "On", "At",
    "In", "From", "To", "By", "Near", "Around", "About", "Approximately",
}

_WEAPONS = (
    r"knife|knives|dagger|blade|machete|sickle|axe|hatchet|hammer|rod|"
    r"iron rod|crowbar|bat|stick|lathi|pistol|revolver|firearm|gun|rifle|"
    r"blunt object|sharp object|ligature|rope|wire|acid|poison"
)

_LOCATION_CUE = (
    r"road|street|lane|nagar|colony|market|bazaar|shop|store|hotel|restaurant|"
    r"cafe|hospital|clinic|station|junction|circle|cross|layout|park|garden|"
    r"apartment|flat|building|complex|mall|temple|mosque|church|school|college|"
    r"bridge|highway|bus stand|railway|airport|godown|warehouse|factory"
)


@dataclass(frozen=True)
class Extraction:
    fact_type: str
    value: str
    start: int
    end: int
    confidence: float
    pattern: str


# (fact_type, compiled pattern, group index that holds the value)
_PATTERNS: list[tuple[str, re.Pattern[str], int, str]] = [
    (
        "TIME",
        re.compile(
            r"\b(?:(?:[01]?\d|2[0-3])[:.][0-5]\d\s*(?:hrs?|hours)?\s*"
            r"(?:[AaPp]\.?[Mm]\.?)?|(?:1[0-2]|[1-9])\s*(?:[AaPp]\.?[Mm]\.?))"
        ),
        0,
        "clock time",
    ),
    (
        "DATE",
        re.compile(
            rf"\b(?:\d{{1,2}}(?:st|nd|rd|th)?\s+(?:{_MONTHS})\.?\s+\d{{4}}"
            rf"|(?:{_MONTHS})\.?\s+\d{{1,2}}(?:st|nd|rd|th)?,?\s+\d{{4}}"
            rf"|\d{{4}}-\d{{2}}-\d{{2}}"
            rf"|\d{{1,2}}[/-]\d{{1,2}}[/-]\d{{2,4}})\b",
            re.IGNORECASE,
        ),
        0,
        "calendar date",
    ),
    (
        "PHONE",
        re.compile(r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b"),
        0,
        "Indian mobile number",
    ),
    (
        "VEHICLE",
        re.compile(r"\b[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}\b"),
        0,
        "vehicle registration",
    ),
    (
        "MONEY",
        re.compile(
            r"(?:(?:Rs\.?|INR|₹)\s?[\d,]+(?:\.\d{2})?"
            r"|\b[\d,]+\s*(?:rupees|lakh|lakhs|crore|crores)\b)",
            re.IGNORECASE,
        ),
        0,
        "monetary amount",
    ),
    (
        "WEAPON",
        re.compile(rf"\b(?:{_WEAPONS})\b", re.IGNORECASE),
        0,
        "weapon term",
    ),
    (
        "LOCATION",
        # Deliberately NOT re.IGNORECASE. With it, the leading [A-Z] also
        # matched lowercase letters, so the pattern swallowed ordinary prose
        # ("suspect left the shop"). The prefix must be a real capitalised
        # proper noun; only the cue word itself is case-insensitive.
        re.compile(rf"\b(?:[A-Z][\w']*\s+){{0,3}}(?:(?i:{_LOCATION_CUE}))\b"),
        0,
        "place name with location cue",
    ),
    (
        "PERSON",
        re.compile(
            r"\b(?:(?:Mr|Mrs|Ms|Dr|Shri|Smt|Insp|SI|ASI|PC|Const)\.?\s+)?"
            r"([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2})\b"
        ),
        0,
        "capitalised name sequence",
    ),
]


def _is_plausible_person(value: str) -> bool:
    parts = value.replace(".", " ").split()
    # A single capitalised word is far too weak a signal to call a person.
    if len(parts) < 2:
        return False
    return not any(p in _NOT_NAMES for p in parts)


def extract(text: str) -> list[Extraction]:
    """Extract entities with exact offsets, de-overlapped.

    Resolution rule when spans overlap: prefer higher confidence, then the
    longer span. So "9:00 PM" beats "00 PM", and a specific date beats a
    fragment of it.
    """
    if not text:
        return []

    candidates: list[Extraction] = []
    for fact_type, pattern, group, description in _PATTERNS:
        for m in pattern.finditer(text):
            value = (m.group(group) or "").strip()
            if not value:
                continue
            if fact_type == "PERSON" and not _is_plausible_person(value):
                continue
            if fact_type == "LOCATION" and len(value) > 60:
                continue
            start = m.start(group)
            end = start + len(value)
            candidates.append(
                Extraction(
                    fact_type=fact_type,
                    value=value,
                    start=start,
                    end=end,
                    confidence=_CONFIDENCE.get(fact_type, 0.6),
                    pattern=description,
                )
            )

    # Strongest first, then longest; greedily keep non-overlapping winners.
    candidates.sort(key=lambda e: (-e.confidence, -(e.end - e.start), e.start))
    kept: list[Extraction] = []
    for cand in candidates:
        if any(not (cand.end <= k.start or cand.start >= k.end) for k in kept):
            continue
        kept.append(cand)

    kept.sort(key=lambda e: e.start)
    return kept


def excerpt_for(text: str, start: int, end: int, pad: int = 90) -> str:
    """A readable window around a match so the officer sees it in context."""
    lo = max(0, start - pad)
    hi = min(len(text), end + pad)
    prefix = "..." if lo > 0 else ""
    suffix = "..." if hi < len(text) else ""
    return f"{prefix}{text[lo:hi].strip()}{suffix}"
