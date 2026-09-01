"""The Groq adapter's anti-hallucination contract.

A language model can invent a quotation; the deterministic provider cannot.
These tests pin the guarantee that matters most on the live path: a fact the
model cannot point at, character for character, in the source text never
reaches the officer.

No API key and no network are needed -- `_chat` is replaced with canned
responses, so what is under test is our handling of model output rather than
Groq's uptime.
"""
from __future__ import annotations

import pytest

from app.ai.providers import groq_provider
from app.ai.providers.groq_provider import GroqProvider, GroqUnavailable

SOURCE = (
    "Witness Ramesh Kumar states the suspect left the shop at 9:00 PM "
    "on 29 August 2026 near MG Road market. A knife was visible."
)


@pytest.fixture()
def provider(monkeypatch):
    """A GroqProvider that never touches the network."""
    monkeypatch.setenv("GROQ_API_KEY", "test-key-not-real")
    return GroqProvider(model="test-model")


def _stub_chat(monkeypatch, payload):
    monkeypatch.setattr(groq_provider, "_chat", lambda **_: payload)


def test_missing_key_refuses_construction(monkeypatch):
    """No key must fail loudly at construction, so the registry can fall back."""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with pytest.raises(GroqUnavailable):
        GroqProvider()


def test_placeholder_key_is_rejected(monkeypatch):
    """A copied-but-unedited .env placeholder is not a key."""
    monkeypatch.setenv("GROQ_API_KEY", "CHANGE_ME_paste_your_key")
    with pytest.raises(GroqUnavailable):
        GroqProvider()


def test_verbatim_fact_is_kept_with_exact_offsets(provider, monkeypatch):
    _stub_chat(
        monkeypatch,
        {
            "facts": [
                {
                    "fact_type": "TIME",
                    "value": "9:00 PM",
                    "excerpt": "the suspect left the shop at 9:00 PM",
                    "confidence": 0.9,
                    "explanation": "Stated departure time.",
                }
            ]
        },
    )
    results = provider.extract(text=SOURCE, context={"evidence_id": 1})

    assert len(results) == 1
    source = results[0].sources[0]
    # The offsets must actually address the value in the source string.
    assert SOURCE[source.offset_start : source.offset_end] == "9:00 PM"
    assert results[0].is_live_inference is True


def test_fabricated_value_is_dropped(provider, monkeypatch):
    """The core guarantee: a value absent from the source produces no fact."""
    _stub_chat(
        monkeypatch,
        {
            "facts": [
                {
                    "fact_type": "PERSON",
                    "value": "Inspector Fictional Person",
                    "excerpt": "Inspector Fictional Person attended the scene",
                    "confidence": 0.99,
                    "explanation": "Confidently invented.",
                }
            ]
        },
    )
    assert provider.extract(text=SOURCE, context={"evidence_id": 1}) == []


def test_paraphrased_value_is_dropped(provider, monkeypatch):
    """Normalising "9:00 PM" to "21:00" breaks the anchor, so it is refused."""
    _stub_chat(
        monkeypatch,
        {
            "facts": [
                {
                    "fact_type": "TIME",
                    "value": "21:00",
                    "excerpt": "the suspect left the shop at 21:00",
                    "confidence": 0.95,
                    "explanation": "Normalised to 24-hour time.",
                }
            ]
        },
    )
    assert provider.extract(text=SOURCE, context={"evidence_id": 1}) == []


def test_bad_excerpt_falls_back_to_a_real_window(provider, monkeypatch):
    """A real value with an invented excerpt keeps the value, fixes the excerpt."""
    _stub_chat(
        monkeypatch,
        {
            "facts": [
                {
                    "fact_type": "WEAPON",
                    "value": "knife",
                    "excerpt": "the assailant brandished a large knife menacingly",
                    "confidence": 0.8,
                    "explanation": "Weapon mentioned.",
                }
            ]
        },
    )
    results = provider.extract(text=SOURCE, context={"evidence_id": 1})

    assert len(results) == 1
    excerpt = results[0].sources[0].excerpt
    assert "brandished" not in excerpt, "invented excerpt was shown to the officer"
    assert "knife" in excerpt


def test_confidence_is_clamped(provider, monkeypatch):
    """A model claiming 4.2 confidence must not produce a 420% meter."""
    _stub_chat(
        monkeypatch,
        {
            "facts": [
                {"fact_type": "WEAPON", "value": "knife", "excerpt": "A knife was visible.",
                 "confidence": 4.2, "explanation": "x"},
            ]
        },
    )
    results = provider.extract(text=SOURCE, context={"evidence_id": 1})
    assert 0.0 <= results[0].confidence <= 1.0


def test_guidance_citation_must_resolve_to_supplied_kb(provider, monkeypatch):
    """An invented kb_id yields no citation rather than a fabricated section."""
    _stub_chat(
        monkeypatch,
        {
            "guidance": [
                {
                    "title": "Real rule",
                    "recommendation": "Do the thing",
                    "rationale": "because",
                    "kb_id": "bns_103",
                    "confidence": 0.8,
                },
                {
                    "title": "Invented rule",
                    "recommendation": "Cite something imaginary",
                    "rationale": "because",
                    "kb_id": "bns_9999_not_real",
                    "confidence": 0.9,
                },
            ]
        },
    )
    kb = [{"kb_id": "bns_103", "section": "BNS Section 103", "title": "Murder",
           "content": "..."}]
    results = provider.guide(case_context={"case": {}}, kb_hits=kb)

    assert results[0].payload["legal_ref"] == "BNS Section 103"
    # The fabricated id resolves to nothing, so no section number is shown.
    assert results[1].payload["legal_ref"] is None


def test_chargesheet_verdict_is_constrained(provider, monkeypatch):
    """An out-of-vocabulary verdict degrades to WARNING, not to nonsense."""
    _stub_chat(
        monkeypatch,
        {
            "findings": [
                {"claim": "A", "verdict": "DEFINITELY_GUILTY", "explanation": "x",
                 "confidence": 0.9},
            ]
        },
    )
    results = provider.chargesheet_qa(chargesheet={"draft_text": "..."}, case_context=[])
    assert results[0].payload["verdict"] == "WARNING"


def test_severity_is_constrained(provider, monkeypatch):
    """Contradiction severity stays inside the vocabulary the UI understands."""
    _stub_chat(
        monkeypatch,
        {"contradictions": [
            {"title": "T", "description": "d", "severity": "APOCALYPTIC",
             "confidence": 0.7, "explanation": "e", "excerpt_a": "a", "excerpt_b": "b"},
        ]},
    )
    results = provider.compare(
        new_item={"text_content": "no times here", "evidence_id": 2},
        case_context=[{"text_content": "none here either", "evidence_id": 1}],
    )
    assert all(r.payload["severity"] in ("MINOR", "MAJOR") for r in results)
