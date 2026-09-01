"""Deterministic offline provider.

This wraps `services/ai_engine.py` -- a rule-based extraction, contradiction,
guidance, autopsy and chargesheet engine with a curated BNS/CrPC knowledge base.

Calling it "mock" understates it slightly: it is not random stub data, it is a
real deterministic analyser. But it is emphatically NOT a language model, and
`is_live_inference = False` makes sure the UI says so. The value of running the
demo on this by default is that the stage demo cannot fail from a network blip,
a rate limit, or a missing API key -- and it produces identical output every
run, which is exactly what you want when a judge asks you to do it twice.
"""
from __future__ import annotations

from typing import Any

from ...services import ai_engine
from .. import extractors, temporal
from ..provider import AIProvider, AIResult, SourceRef

# Curated KB indexed by id, so guidance citations resolve to real section
# numbers instead of the prose blurb ai_engine returns.
_KB_BY_ID = {e["id"]: e for e in ai_engine.LEGAL_KB}


def _locate(needle: str, haystack: str) -> tuple[int | None, int | None]:
    """Character offsets of `needle` in `haystack`, if present verbatim."""
    if not needle or not haystack:
        return None, None
    idx = haystack.find(needle)
    if idx < 0:
        # Try a case-insensitive pass before giving up.
        idx = haystack.lower().find(needle.lower())
    if idx < 0:
        return None, None
    return idx, idx + len(needle)


class MockProvider(AIProvider):
    name = "mock"
    model = "rule-based-v1"
    is_live_inference = False

    # -- extraction ----------------------------------------------------------
    def extract(self, *, text: str, context: dict[str, Any]) -> list[AIResult]:
        """Structured facts, each anchored to exact characters in the source.

        Uses ai.extractors rather than ai_engine.extract_entities: the latter
        emits overlapping, nested spans that read as noise on screen.
        """
        evidence_id = context.get("evidence_id")
        evidence_uid = context.get("evidence_uid")
        results: list[AIResult] = []

        for ex in extractors.extract(text or ""):
            results.append(
                AIResult(
                    kind="fact",
                    payload={
                        "fact_type": ex.fact_type,
                        "value": ex.value,
                        "normalized_value": ex.value,
                    },
                    confidence=ex.confidence,
                    explanation=(
                        f"Matched {ex.pattern} at characters {ex.start}-{ex.end}. "
                        f"Deterministic pattern match, not a model inference - "
                        f"verify against the highlighted source text."
                    ),
                    sources=[
                        SourceRef(
                            evidence_id=evidence_id,
                            evidence_uid=evidence_uid,
                            excerpt=extractors.excerpt_for(text, ex.start, ex.end),
                            offset_start=ex.start,
                            offset_end=ex.end,
                        )
                    ],
                    provider=self.name,
                    model=self.model,
                    is_live_inference=False,
                )
            )
        return results

    # -- contradiction detection --------------------------------------------
    def compare(
        self, *, new_item: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        items = list(case_context) + [new_item]
        timeline = ai_engine.build_timeline_candidates(items)
        found = ai_engine.detect_contradictions(items, timeline)

        results: list[AIResult] = list(self._temporal_conflicts(new_item, case_context))
        for c in found or []:
            sources = [
                SourceRef(
                    evidence_id=s.get("evidence_id"),
                    evidence_uid=s.get("evidence_uid"),
                    excerpt=s.get("excerpt", ""),
                )
                for s in (c.get("sources") or [])
            ]
            results.append(
                AIResult(
                    kind="contradiction",
                    payload={
                        "title": c.get("title") or c.get("type", "Possible conflict"),
                        "description": c.get("description", ""),
                        "contradiction_type": c.get("type", "GENERIC"),
                        "severity": (c.get("severity") or "MINOR").upper(),
                    },
                    confidence=float(c.get("confidence", 0.6)),
                    explanation=c.get("explanation") or c.get("description", ""),
                    sources=sources,
                    provider=self.name,
                    model=self.model,
                )
            )
        return results

    def _temporal_conflicts(
        self, new_item: dict[str, Any], case_context: list[dict[str, Any]]
    ):
        """Minute-precision time conflicts between the new item and the case.

        ai_engine.detect_contradictions compares times bucketed to the hour, so
        it cannot separate 21:00 from 21:47 -- the exact conflict the spec uses
        as its worked example. This adds the precise comparison.
        """
        new_text = str(new_item.get("text_content") or new_item.get("raw_content") or "")
        if not new_text:
            return

        for prior in case_context:
            prior_text = str(prior.get("text_content") or prior.get("raw_content") or "")
            if not prior_text:
                continue

            conflict = temporal.compare_times(prior_text, new_text)
            if conflict is None:
                continue

            yield AIResult(
                kind="contradiction",
                payload={
                    "title": (
                        f"Time conflict: {prior.get('title', 'source A')} says "
                        f"{conflict.a.display}, {new_item.get('title', 'source B')} "
                        f"says {conflict.b.display}"
                    ),
                    "description": (
                        f"The two sources place the same event "
                        f"{conflict.minutes_apart} minutes apart."
                    ),
                    "contradiction_type": "TIME_MISMATCH",
                    "severity": conflict.severity,
                },
                confidence=conflict.confidence,
                explanation=conflict.explanation,
                sources=[
                    SourceRef(
                        evidence_id=prior.get("evidence_id") or prior.get("id"),
                        evidence_uid=prior.get("evidence_uid"),
                        excerpt=temporal.excerpt_around(prior_text, conflict.a),
                        offset_start=conflict.a.start,
                        offset_end=conflict.a.end,
                    ),
                    SourceRef(
                        evidence_id=new_item.get("evidence_id") or new_item.get("id"),
                        evidence_uid=new_item.get("evidence_uid"),
                        excerpt=temporal.excerpt_around(new_text, conflict.b),
                        offset_start=conflict.b.start,
                        offset_end=conflict.b.end,
                    ),
                ],
                provider=self.name,
                model=self.model,
            )

    # -- procedural guidance -------------------------------------------------
    def guide(
        self, *, case_context: dict[str, Any], kb_hits: list[dict[str, Any]]
    ) -> list[AIResult]:
        # Signature is (case_title, evidence_items, contradictions) and it
        # returns a list, not a dict.
        raw = ai_engine.generate_guidance(
            str(case_context.get("case", {}).get("title", "")),
            case_context.get("evidence", []),
            case_context.get("contradictions", []),
        )
        items = raw.get("guidance", raw) if isinstance(raw, dict) else raw
        results: list[AIResult] = []
        for g in items or []:
            if not isinstance(g, dict):
                continue

            # ai_engine returns `source_kb_id` (e.g. "post_mortem") plus a prose
            # `legal_reference`. Resolve the id back to the curated KB entry so
            # the citation is a real section number an officer can look up,
            # rather than a sentence fragment.
            entry = _KB_BY_ID.get(g.get("source_kb_id", ""))
            legal_ref = entry.get("section") if entry else None

            results.append(
                AIResult(
                    kind="guidance",
                    payload={
                        "title": g.get("title") or g.get("step", "Next step"),
                        "recommendation": (
                            g.get("description") or g.get("action") or ""
                        ),
                        "rationale": (
                            g.get("rationale")
                            or g.get("why")
                            or g.get("legal_reference", "")
                        ),
                        "category": (g.get("category") or "PROCEDURE").upper(),
                        "priority": (g.get("priority") or "NORMAL").upper(),
                        "legal_ref": legal_ref,
                        "legal_title": entry.get("title") if entry else None,
                        "legal_text": entry.get("text") if entry else None,
                        "checklist": entry.get("checklist") if entry else None,
                    },
                    confidence=float(g.get("confidence", 0.7)),
                    explanation=(
                        g.get("description")
                        or g.get("rationale")
                        or g.get("legal_reference", "")
                    ),
                    sources=[SourceRef(kb_ref=legal_ref)] if legal_ref else [],
                    provider=self.name,
                    model=self.model,
                )
            )
        return results

    # -- autopsy cross-reference --------------------------------------------
    def medical_crossref(
        self, *, report: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        # Signature is (autopsy_text, timeline_events, evidence_items).
        raw = ai_engine.analyze_autopsy(
            str(report.get("text") or report.get("summary") or ""),
            report.get("timeline", []),
            case_context,
        )
        items = raw.get("hypotheses", raw) if isinstance(raw, dict) else raw
        results: list[AIResult] = []
        for h in items or []:
            if not isinstance(h, dict):
                continue
            results.append(
                AIResult(
                    kind="hypothesis",
                    payload={
                        "title": h.get("title", "Investigative hypothesis"),
                        "hypothesis": h.get("hypothesis") or h.get("finding", ""),
                        "reasoning": h.get("reasoning") or h.get("why", ""),
                        "hypothesis_type": h.get("type", "TIMELINE_CONSISTENCY"),
                    },
                    confidence=float(h.get("confidence", 0.5)),
                    explanation=h.get("reasoning") or h.get("why", ""),
                    provider=self.name,
                    model=self.model,
                )
            )
        return results

    # -- chargesheet QA ------------------------------------------------------
    def chargesheet_qa(
        self, *, chargesheet: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        # Signature is (case_title, evidence_items, timeline_events,
        # contradictions, chargesheet_text).
        raw = ai_engine.run_chargesheet_qa(
            str(chargesheet.get("case_title", "")),
            case_context,
            chargesheet.get("timeline", []),
            chargesheet.get("contradictions", []),
            chargesheet.get("draft_text"),
        )
        items = raw.get("findings", raw) if isinstance(raw, dict) else raw
        results: list[AIResult] = []
        for f in items or []:
            if not isinstance(f, dict):
                continue
            results.append(
                AIResult(
                    kind="chargesheet_finding",
                    payload={
                        "claim": f.get("claim", ""),
                        "verdict": (f.get("verdict") or "WARNING").upper(),
                        "legal_ref": f.get("section") or f.get("legal_ref"),
                    },
                    confidence=float(f.get("confidence", 0.6)),
                    explanation=f.get("explanation") or f.get("why", ""),
                    provider=self.name,
                    model=self.model,
                )
            )
        return results


def _window(text: str, start: int, end: int, pad: int = 90) -> str:
    """A readable excerpt around the match, so the officer sees context."""
    lo = max(0, start - pad)
    hi = min(len(text), end + pad)
    prefix = "..." if lo > 0 else ""
    suffix = "..." if hi < len(text) else ""
    return f"{prefix}{text[lo:hi].strip()}{suffix}"
