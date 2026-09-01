"""Minute-precision temporal reasoning for contradiction detection.

`ai_engine._hours_from_times` buckets times to the hour, so "9:00 PM" yields
{12, 21} and "21:47" yields {21, 47}. Those sets intersect at 21, and the engine
concludes the two statements agree -- when in fact they differ by 47 minutes.

That is precisely the contradiction the specification uses as its worked example
("a witness statement says the suspect left at 9 PM, but CCTV metadata shows a
different time"), so hour granularity cannot detect the one conflict the product
is built to demonstrate.

This module parses clock times to minutes-since-midnight and compares them with
an explicit, configurable tolerance, so the discrepancy is both detected and
quantified in the officer-facing explanation.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Times within this many minutes are treated as consistent: witnesses round,
# clocks drift, and flagging "9:00" against "9:02" would be noise.
DEFAULT_TOLERANCE_MINUTES = 15

# Beyond this, a discrepancy is a major conflict rather than a minor one.
MAJOR_CONFLICT_MINUTES = 30

_TIME_PATTERNS = [
    # 9:00 PM / 9.00pm / 09:00 P.M.
    re.compile(
        r"\b(?P<h>1[0-2]|0?[1-9])[:.](?P<m>[0-5]\d)\s*(?P<mer>[AaPp])\.?[Mm]\.?"
    ),
    # 9 PM / 9pm
    re.compile(r"\b(?P<h>1[0-2]|0?[1-9])\s*(?P<mer>[AaPp])\.?[Mm]\.?"),
    # 21:47 / 21:47 hrs / 2147 hrs
    re.compile(r"\b(?P<h>[01]?\d|2[0-3])[:.](?P<m>[0-5]\d)\s*(?:hrs?|hours)?\b"),
]


@dataclass(frozen=True)
class ClockTime:
    raw: str
    minutes: int  # minutes since midnight
    start: int
    end: int

    @property
    def display(self) -> str:
        return f"{self.minutes // 60:02d}:{self.minutes % 60:02d}"


def parse_times(text: str) -> list[ClockTime]:
    """All clock times in `text`, normalised to minutes since midnight."""
    if not text:
        return []

    found: list[ClockTime] = []
    claimed: list[tuple[int, int]] = []

    for pattern in _TIME_PATTERNS:
        for m in pattern.finditer(text):
            span = (m.start(), m.end())
            # A 12-hour match wins over the bare-hour pattern covering the same
            # characters, so "9:00 PM" is not also read as "9 PM".
            if any(not (span[1] <= s or span[0] >= e) for s, e in claimed):
                continue

            hour = int(m.group("h"))
            minute = int(m.groupdict().get("m") or 0)
            mer = (m.groupdict().get("mer") or "").lower()

            if mer == "p" and hour != 12:
                hour += 12
            elif mer == "a" and hour == 12:
                hour = 0

            if not (0 <= hour <= 23):
                continue

            claimed.append(span)
            found.append(
                ClockTime(
                    raw=m.group(0).strip(),
                    minutes=hour * 60 + minute,
                    start=m.start(),
                    end=m.end(),
                )
            )

    found.sort(key=lambda t: t.start)
    return found


@dataclass
class TemporalConflict:
    minutes_apart: int
    severity: str
    a: ClockTime
    b: ClockTime
    confidence: float
    explanation: str


def compare_times(
    a_text: str,
    b_text: str,
    *,
    tolerance_minutes: int = DEFAULT_TOLERANCE_MINUTES,
) -> TemporalConflict | None:
    """Compare the clock times asserted by two sources.

    Returns the single widest discrepancy, or None when every pairing falls
    inside tolerance. Reporting the widest gap keeps one flag per pair of
    documents instead of a flag per pair of timestamps.
    """
    a_times = parse_times(a_text)
    b_times = parse_times(b_text)
    if not a_times or not b_times:
        return None

    # If any pairing agrees, the sources are consistent: a document that
    # mentions several times only has to match on one of them.
    best: tuple[int, ClockTime, ClockTime] | None = None
    for ta in a_times:
        for tb in b_times:
            delta = abs(ta.minutes - tb.minutes)
            # Times either side of midnight are close, not 23 hours apart.
            delta = min(delta, 24 * 60 - delta)
            if delta <= tolerance_minutes:
                return None
            if best is None or delta > best[0]:
                best = (delta, ta, tb)

    if best is None:
        return None

    delta, ta, tb = best
    severity = "MAJOR" if delta >= MAJOR_CONFLICT_MINUTES else "MINOR"
    # Wider gaps are less likely to be rounding, so confidence rises with the
    # size of the discrepancy, capped so it never reads as certainty.
    confidence = min(0.95, 0.55 + (delta / 240.0))

    explanation = (
        f"One source places the event at {ta.display} (\"{ta.raw}\") and the other "
        f"at {tb.display} (\"{tb.raw}\") - a difference of {delta} minutes, beyond "
        f"the {tolerance_minutes}-minute tolerance allowed for rounding and clock "
        f"drift. This is a prompt to check both sources, not a finding that either "
        f"is false."
    )
    return TemporalConflict(
        minutes_apart=delta,
        severity=severity,
        a=ta,
        b=tb,
        confidence=round(confidence, 2),
        explanation=explanation,
    )


def excerpt_around(text: str, t: ClockTime, pad: int = 100) -> str:
    lo = max(0, t.start - pad)
    hi = min(len(text), t.end + pad)
    prefix = "..." if lo > 0 else ""
    suffix = "..." if hi < len(text) else ""
    return f"{prefix}{text[lo:hi].strip()}{suffix}"
