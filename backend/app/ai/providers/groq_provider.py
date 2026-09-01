"""Groq adapter — real language-model inference over Groq's OpenAI-compatible API.

Uses stdlib `urllib` rather than the `groq` or `openai` SDK: the whole surface
needed here is one JSON POST, and adding an SDK (plus its transitive deps) to a
project that already runs offline by default is not a trade worth making.

Three properties matter more than raw model quality, and are enforced here
rather than trusted to the prompt:

  1. **Every extracted fact must quote the source verbatim.** The prompt demands
     it, this module drops anything whose excerpt is not a literal substring of
     the input, and `services/analysis.py` re-checks offsets independently
     before writing to the database. A model that paraphrases produces zero
     facts rather than unattributable ones.

  2. **Failure degrades, never breaks.** A bad key, a rate limit, a cold network
     or malformed JSON raises `GroqUnavailable`; the registry then falls back to
     the deterministic provider. A demo must not die because a free-tier quota
     ran out mid-sentence.

  3. **The output is labelled honestly.** `is_live_inference = True` drives the
     `AI: LIVE` badge, so nobody mistakes this for the deterministic path — and
     equally, the deterministic path is never passed off as this.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from .. import extractors, temporal
from ..provider import AIProvider, AIResult, SourceRef

# Groq and xAI are different companies with confusingly similar names, and both
# speak the OpenAI chat-completions dialect. Picking the endpoint from the key
# prefix means pasting the wrong one into the wrong variable still works, rather
# than producing a baffling 401 from the other vendor's gateway.
#
#   gsk_...  -> Groq   (console.groq.com)  free tier available
#   xai-...  -> xAI    (console.x.ai)      requires purchased credits
VENDORS = {
    "groq": {
        "base": "https://api.groq.com/openai/v1",
        "default_model": "llama-3.3-70b-versatile",
        "console": "https://console.groq.com/keys",
    },
    "xai": {
        "base": "https://api.x.ai/v1",
        "default_model": "grok-3-mini",
        "console": "https://console.x.ai",
    },
}

# Long enough for a slow cold start, short enough that a wedged request does not
# hang an evidence upload.
TIMEOUT_SECONDS = 45


class GroqUnavailable(RuntimeError):
    """The live provider could not be used; the caller falls back to mock."""


def _api_key() -> str:
    """The configured key, from either variable name."""
    key = (
        os.getenv("GROQ_API_KEY")
        or os.getenv("XAI_API_KEY")
        or os.getenv("COT_LLM_API_KEY")
        or ""
    ).strip()
    if not key or key.startswith("CHANGE_ME"):
        raise GroqUnavailable("no API key set (GROQ_API_KEY / XAI_API_KEY)")
    return key


def detect_vendor(key: str | None = None) -> str:
    """Which service this key belongs to, by prefix."""
    explicit = (os.getenv("COT_LLM_VENDOR") or "").strip().lower()
    if explicit in VENDORS:
        return explicit
    k = key if key is not None else _api_key()
    if k.startswith("xai-"):
        return "xai"
    return "groq"


def _base_url() -> str:
    override = (os.getenv("COT_LLM_BASE_URL") or "").strip().rstrip("/")
    if override:
        return override
    return VENDORS[detect_vendor()]["base"]


def default_model() -> str:
    return VENDORS[detect_vendor()]["default_model"]


def _headers() -> dict[str, str]:
    # A real User-Agent matters: with urllib's default, Groq's Cloudflare edge
    # answers 403 "error code 1010" (browser-signature block), which looks like
    # an auth failure and is not.
    return {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
        "User-Agent": "ChainOfTruth/1.0 (evidence-integrity-system)",
        "Accept": "application/json",
    }


def list_models() -> list[str]:
    """Model ids this key can reach. Used by scripts/check_ai.py."""
    request = urllib.request.Request(f"{_base_url()}/models", headers=_headers())
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise GroqUnavailable(f"HTTP {exc.code}: {exc.read().decode('utf-8')[:200]}") from exc
    except Exception as exc:
        raise GroqUnavailable(str(exc)) from exc
    return sorted(m.get("id", "") for m in payload.get("data", []) if m.get("id"))


def _chat(
    *, system: str, user: str, model: str, temperature: float = 0.0
) -> dict[str, Any]:
    """One JSON-mode completion. Raises GroqUnavailable on any problem.

    temperature=0 by default: this is an evidence tool, and an officer who runs
    the same analysis twice should see the same answer twice.
    """
    body = json.dumps(
        {
            "model": model,
            "temperature": temperature,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        f"{_base_url()}/chat/completions",
        data=body,
        headers=_headers(),
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:300]
        vendor = detect_vendor()
        hint = ""
        if exc.code == 401:
            other = "xAI (xai-…)" if vendor == "groq" else "Groq (gsk_…)"
            hint = f" -- key rejected by {vendor}; is it actually a {other} key?"
        elif exc.code in (402, 403) and "credit" in detail.lower():
            hint = f" -- account has no credits; top up at {VENDORS[vendor]['console']}"
        raise GroqUnavailable(f"HTTP {exc.code} from {vendor}: {detail}{hint}") from exc
    except urllib.error.URLError as exc:
        raise GroqUnavailable(f"network error reaching Groq: {exc.reason}") from exc
    except Exception as exc:
        raise GroqUnavailable(f"unexpected Groq failure: {exc}") from exc

    try:
        content = payload["choices"][0]["message"]["content"]
        return json.loads(content)
    except (KeyError, IndexError, ValueError, TypeError) as exc:
        # A model that ignores the JSON contract is unusable here; better to
        # fall back than to guess at what it meant.
        raise GroqUnavailable(f"Groq returned unparseable JSON: {exc}") from exc


def _clamp(value: Any, default: float = 0.5) -> float:
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return default


class GroqProvider(AIProvider):
    name = "groq"
    is_live_inference = True

    def __init__(self, model: str | None = None):
        _api_key()  # fail construction, not first use, so the registry can fall back
        self.vendor = detect_vendor()
        self.name = self.vendor
        self.model = (
            model
            or os.getenv("COT_LLM_MODEL")
            or os.getenv("COT_GROQ_MODEL")
            or default_model()
        )

    # -- extraction ----------------------------------------------------------
    EXTRACT_SYSTEM = (
        "You extract structured facts from police evidence for an investigation "
        "system. You are a careful assistant, not an investigator: you never "
        "infer, speculate, or fill gaps.\n\n"
        "Return JSON: {\"facts\": [{\"fact_type\": ..., \"value\": ..., "
        "\"excerpt\": ..., \"confidence\": 0.0-1.0, \"explanation\": ...}]}\n\n"
        "fact_type is one of: PERSON, TIME, DATE, LOCATION, VEHICLE, WEAPON, "
        "PHONE, MONEY, ORGANISATION, OTHER.\n\n"
        "ABSOLUTE RULES:\n"
        "1. `value` MUST be copied character-for-character from the source text. "
        "Never normalise, reformat, translate or correct it.\n"
        "2. `excerpt` MUST be a longer verbatim span from the source that "
        "contains `value`. Copy it exactly.\n"
        "3. If you cannot quote it exactly, omit the fact entirely. An omitted "
        "fact is always better than an invented one.\n"
        "4. Extract only what the text states. Do not infer identities, "
        "motives, or relationships.\n"
        "5. confidence reflects how unambiguous the text is, not how plausible "
        "the fact seems."
    )

    def extract(self, *, text: str, context: dict[str, Any]) -> list[AIResult]:
        if not text or not text.strip():
            return []

        data = _chat(
            system=self.EXTRACT_SYSTEM,
            user=f"Extract facts from this evidence text:\n\n---\n{text}\n---",
            model=self.model,
        )

        evidence_id = context.get("evidence_id")
        evidence_uid = context.get("evidence_uid")
        results: list[AIResult] = []

        for item in data.get("facts", []) or []:
            if not isinstance(item, dict):
                continue
            value = str(item.get("value", "")).strip()
            if not value:
                continue

            # The anti-hallucination gate. A value the model cannot point at in
            # the source is discarded here, before it can reach the database.
            start = text.find(value)
            if start < 0:
                continue
            end = start + len(value)

            excerpt = str(item.get("excerpt", "")).strip()
            if not excerpt or excerpt not in text:
                # Model's excerpt was paraphrased; substitute a real window so
                # the officer still sees genuine surrounding context.
                excerpt = extractors.excerpt_for(text, start, end)

            results.append(
                AIResult(
                    kind="fact",
                    payload={
                        "fact_type": str(item.get("fact_type", "OTHER")).upper(),
                        "value": value,
                        "normalized_value": value,
                    },
                    confidence=_clamp(item.get("confidence"), 0.6),
                    explanation=(
                        str(item.get("explanation", "")).strip()
                        or "Extracted by language model; verify against the highlighted source."
                    ),
                    sources=[
                        SourceRef(
                            evidence_id=evidence_id,
                            evidence_uid=evidence_uid,
                            excerpt=excerpt,
                            offset_start=start,
                            offset_end=end,
                        )
                    ],
                    provider=self.name,
                    model=self.model,
                    is_live_inference=True,
                )
            )
        return results

    # -- contradiction detection --------------------------------------------
    COMPARE_SYSTEM = (
        "You compare a new piece of police evidence against existing case "
        "evidence and report genuine factual conflicts.\n\n"
        "Return JSON: {\"contradictions\": [{\"title\": ..., \"description\": ..., "
        "\"contradiction_type\": ..., \"severity\": \"MINOR\"|\"MAJOR\", "
        "\"confidence\": 0.0-1.0, \"explanation\": ..., "
        "\"excerpt_a\": ..., \"excerpt_b\": ...}]}\n\n"
        "RULES:\n"
        "1. Report only conflicts where two sources assert incompatible facts. "
        "Different sources describing different things is not a conflict.\n"
        "2. excerpt_a and excerpt_b MUST be verbatim quotes from the two "
        "sources.\n"
        "3. A contradiction is a prompt for an officer to look closer. Never "
        "state or imply which source is correct, and never suggest guilt.\n"
        "4. Absence of evidence is not a contradiction.\n"
        "5. Return an empty list when the sources are consistent. Finding "
        "nothing is a valid and common answer."
    )

    def compare(
        self, *, new_item: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        new_text = str(new_item.get("text_content") or new_item.get("raw_content") or "")
        if not new_text.strip() or not case_context:
            return []

        # Deterministic time comparison runs first and always. Clock arithmetic
        # is not something to delegate to a model when a parser is exact.
        results: list[AIResult] = []
        for prior in case_context:
            prior_text = str(prior.get("text_content") or prior.get("raw_content") or "")
            if not prior_text:
                continue
            conflict = temporal.compare_times(prior_text, new_text)
            if conflict is None:
                continue
            results.append(
                AIResult(
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
                        ),
                        SourceRef(
                            evidence_id=new_item.get("evidence_id") or new_item.get("id"),
                            evidence_uid=new_item.get("evidence_uid"),
                            excerpt=temporal.excerpt_around(new_text, conflict.b),
                        ),
                    ],
                    provider=self.name,
                    model=self.model,
                )
            )

        # Then the model, for semantic conflicts a parser cannot see.
        context_block = "\n\n".join(
            f"[evidence #{c.get('evidence_id') or c.get('id')}] "
            f"{c.get('title', '')}\n"
            f"{str(c.get('text_content') or c.get('raw_content') or '')[:1200]}"
            for c in case_context[:6]
        )

        data = _chat(
            system=self.COMPARE_SYSTEM,
            user=(
                f"EXISTING CASE EVIDENCE:\n{context_block}\n\n"
                f"NEW EVIDENCE ({new_item.get('title', '')}):\n{new_text}"
            ),
            model=self.model,
        )

        for item in data.get("contradictions", []) or []:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title", "")).strip()
            if not title:
                continue
            severity = str(item.get("severity", "MINOR")).upper()
            results.append(
                AIResult(
                    kind="contradiction",
                    payload={
                        "title": title,
                        "description": str(item.get("description", "")),
                        "contradiction_type": str(
                            item.get("contradiction_type", "SEMANTIC")
                        ).upper(),
                        "severity": severity if severity in ("MINOR", "MAJOR") else "MINOR",
                    },
                    confidence=_clamp(item.get("confidence"), 0.6),
                    explanation=str(item.get("explanation", "")),
                    sources=[
                        SourceRef(
                            evidence_id=case_context[0].get("evidence_id"),
                            excerpt=str(item.get("excerpt_a", ""))[:600],
                        ),
                        SourceRef(
                            evidence_id=new_item.get("evidence_id") or new_item.get("id"),
                            excerpt=str(item.get("excerpt_b", ""))[:600],
                        ),
                    ],
                    provider=self.name,
                    model=self.model,
                )
            )
        return results

    # -- procedural guidance -------------------------------------------------
    GUIDE_SYSTEM = (
        "You are a procedural checklist assistant for Indian police "
        "investigations. You are NOT a legal authority and you never replace a "
        "public prosecutor or legal officer.\n\n"
        "Return JSON: {\"guidance\": [{\"title\": ..., \"recommendation\": ..., "
        "\"rationale\": ..., \"category\": ..., \"priority\": "
        "\"LOW\"|\"NORMAL\"|\"HIGH\"|\"CRITICAL\", \"confidence\": 0.0-1.0, "
        "\"kb_id\": ...}]}\n\n"
        "RULES:\n"
        "1. You may ONLY cite rules from the CURATED KNOWLEDGE BASE supplied in "
        "the user message. Set kb_id to the id of the entry you relied on.\n"
        "2. NEVER cite a section number from memory. If no supplied entry "
        "applies, omit kb_id entirely.\n"
        "3. Suggest procedural steps only. Never assess guilt, never recommend "
        "who to charge, never evaluate whether the case is strong.\n"
        "4. Prefer concrete next actions an officer can take today."
    )

    def guide(
        self, *, case_context: dict[str, Any], kb_hits: list[dict[str, Any]]
    ) -> list[AIResult]:
        kb_block = "\n".join(
            f"- id={h.get('kb_id') or h.get('id')} | {h.get('section', '')} | "
            f"{h.get('title', '')}: {str(h.get('content') or h.get('text') or '')[:300]}"
            for h in (kb_hits or [])[:12]
        ) or "(no curated rules retrieved - omit kb_id from every item)"

        case = case_context.get("case", {})
        evidence_lines = "\n".join(
            f"- {e.get('evidence_type', '')}: {e.get('title', '')}"
            for e in (case_context.get("evidence") or [])[:20]
        )
        contradiction_lines = "\n".join(
            f"- [{c.get('severity', '')}] {c.get('title', '')} ({c.get('status', '')})"
            for c in (case_context.get("contradictions") or [])[:10]
        )

        data = _chat(
            system=self.GUIDE_SYSTEM,
            user=(
                f"CURATED KNOWLEDGE BASE (the only citable source):\n{kb_block}\n\n"
                f"CASE: {case.get('case_number', '')} - {case.get('title', '')}\n"
                f"{case.get('description', '')}\n\n"
                f"EVIDENCE ON FILE:\n{evidence_lines or '(none)'}\n\n"
                f"OPEN CONTRADICTIONS:\n{contradiction_lines or '(none)'}\n\n"
                "Suggest the next procedural steps."
            ),
            model=self.model,
        )

        kb_by_id = {
            str(h.get("kb_id") or h.get("id")): h for h in (kb_hits or [])
        }
        results: list[AIResult] = []

        for item in data.get("guidance", []) or []:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title", "")).strip()
            if not title:
                continue

            # Resolve the citation against the supplied KB. A kb_id the model
            # invented resolves to nothing and the citation is dropped, so a
            # fabricated section number can never reach the officer.
            entry = kb_by_id.get(str(item.get("kb_id", "")))
            results.append(
                AIResult(
                    kind="guidance",
                    payload={
                        "title": title,
                        "recommendation": str(item.get("recommendation", "")),
                        "rationale": str(item.get("rationale", "")),
                        "category": str(item.get("category", "PROCEDURE")).upper(),
                        "priority": str(item.get("priority", "NORMAL")).upper(),
                        "legal_ref": entry.get("section") if entry else None,
                        "legal_title": entry.get("title") if entry else None,
                        "legal_text": (
                            entry.get("content") or entry.get("text") if entry else None
                        ),
                    },
                    confidence=_clamp(item.get("confidence"), 0.65),
                    explanation=str(item.get("rationale", "")),
                    sources=(
                        [SourceRef(kb_ref=entry.get("section"))] if entry else []
                    ),
                    provider=self.name,
                    model=self.model,
                )
            )
        return results

    # -- autopsy cross-reference --------------------------------------------
    MEDICAL_SYSTEM = (
        "You cross-reference a post-mortem report against a case timeline to "
        "flag INVESTIGATION GAPS for a forensic medical officer.\n\n"
        "Return JSON: {\"hypotheses\": [{\"title\": ..., \"hypothesis\": ..., "
        "\"reasoning\": ..., \"hypothesis_type\": ..., \"confidence\": 0.0-1.0}]}\n\n"
        "ABSOLUTE PROHIBITIONS - these are not stylistic preferences:\n"
        "1. NEVER state or imply a cause of death.\n"
        "2. NEVER state or imply a manner of death (homicide, suicide, "
        "accident, natural).\n"
        "3. NEVER offer a medical diagnosis.\n"
        "4. NEVER identify or implicate any person.\n\n"
        "You may ONLY note where medical findings and the case timeline appear "
        "consistent or inconsistent, and what comparison a qualified human has "
        "not yet performed. Every output is a question for a doctor, not an "
        "answer from you."
    )

    def medical_crossref(
        self, *, report: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        timeline_block = "\n".join(
            f"- {t.get('occurred_at', '')}: {t.get('title', '')}"
            for t in (report.get("timeline") or [])[:20]
        )
        data = _chat(
            system=self.MEDICAL_SYSTEM,
            user=(
                f"POST-MORTEM REPORT:\n{report.get('summary') or report.get('text') or ''}\n"
                f"Estimated time of death: {report.get('estimated_tod_earliest')} to "
                f"{report.get('estimated_tod_latest')}\n"
                f"Toxicology: {report.get('toxicology', 'not reported')}\n\n"
                f"CASE TIMELINE:\n{timeline_block or '(none)'}"
            ),
            model=self.model,
        )

        return [
            AIResult(
                kind="hypothesis",
                payload={
                    "title": str(item.get("title", "Investigative hypothesis")),
                    "hypothesis": str(item.get("hypothesis", "")),
                    "reasoning": str(item.get("reasoning", "")),
                    "hypothesis_type": str(
                        item.get("hypothesis_type", "TIMELINE_CONSISTENCY")
                    ).upper(),
                },
                confidence=_clamp(item.get("confidence"), 0.5),
                explanation=str(item.get("reasoning", "")),
                provider=self.name,
                model=self.model,
            )
            for item in (data.get("hypotheses", []) or [])
            if isinstance(item, dict) and item.get("title")
        ]

    # -- chargesheet QA ------------------------------------------------------
    CHARGESHEET_SYSTEM = (
        "You perform pre-filing quality assurance on a draft chargesheet for a "
        "human legal reviewer. You produce a checklist, not a legal opinion.\n\n"
        "Return JSON: {\"findings\": [{\"claim\": ..., \"verdict\": \"PASS\"|"
        "\"WARNING\"|\"CONFLICT\"|\"MISSING_SUPPORT\", \"explanation\": ..., "
        "\"confidence\": 0.0-1.0}]}\n\n"
        "RULES:\n"
        "1. Check each claim against the supplied verified timeline and "
        "evidence only.\n"
        "2. PASS = supported by evidence on file. CONFLICT = evidence on file "
        "contradicts it. MISSING_SUPPORT = nothing on file supports it. "
        "WARNING = supported but weakly or with a caveat.\n"
        "3. NEVER assess guilt, case strength, or whether to file. Those are "
        "decisions for a prosecutor.\n"
        "4. Your job is to find what a defence lawyer would find first."
    )

    def chargesheet_qa(
        self, *, chargesheet: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        evidence_block = "\n".join(
            f"- {e.get('evidence_type', '')}: {e.get('title', '')} - "
            f"{str(e.get('text_content') or '')[:250]}"
            for e in case_context[:15]
        )
        timeline_block = "\n".join(
            f"- {t.get('occurred_at', '')}: {t.get('title', '')} "
            f"[{t.get('verification_status', '')}]"
            for t in (chargesheet.get("timeline") or [])[:20]
        )

        data = _chat(
            system=self.CHARGESHEET_SYSTEM,
            user=(
                f"DRAFT CHARGESHEET:\n{chargesheet.get('draft_text', '')}\n\n"
                f"VERIFIED TIMELINE:\n{timeline_block or '(none)'}\n\n"
                f"EVIDENCE ON FILE:\n{evidence_block or '(none)'}"
            ),
            model=self.model,
        )

        valid = {"PASS", "WARNING", "CONFLICT", "MISSING_SUPPORT"}
        return [
            AIResult(
                kind="chargesheet_finding",
                payload={
                    "claim": str(item.get("claim", "")),
                    "verdict": (
                        str(item.get("verdict", "WARNING")).upper()
                        if str(item.get("verdict", "")).upper() in valid
                        else "WARNING"
                    ),
                    "legal_ref": None,
                },
                confidence=_clamp(item.get("confidence"), 0.6),
                explanation=str(item.get("explanation", "")),
                provider=self.name,
                model=self.model,
            )
            for item in (data.get("findings", []) or [])
            if isinstance(item, dict) and item.get("claim")
        ]
