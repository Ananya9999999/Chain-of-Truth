"""The AI provider seam.

Everything the system asks a model to do goes through this interface, so the
provider can be swapped without touching a service or a route. Two adapters
ship: MockProvider (deterministic, offline, no API key) and AnthropicProvider
(real inference).

Which one ran is recorded per job in processing_jobs.provider and surfaced in
the UI as an AI: MOCK / AI: LIVE badge. Mock output is never presented as real
inference -- that would be exactly the kind of overclaiming the spec warns
against.

The five reasoning modes map 1:1 to the spec's "Where and How AI Is Used"
table, and all five are served by one retrieval + reasoning engine.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ReasoningMode(str, Enum):
    """One engine, five jobs -- mirrors PDF section 6."""

    EXTRACTION = "EXTRACTION"
    COMPARISON = "COMPARISON"
    GUIDANCE = "GUIDANCE"
    MEDICAL_CROSSREF = "MEDICAL_CROSSREF"
    CHARGESHEET_QA = "CHARGESHEET_QA"


@dataclass
class SourceRef:
    """Where a claim came from. Required on every AI output."""

    evidence_id: int | None = None
    evidence_uid: str | None = None
    excerpt: str = ""
    offset_start: int | None = None
    offset_end: int | None = None
    frame_ts: str | None = None
    kb_ref: str | None = None


@dataclass
class AIResult:
    """A structured, attributable AI output.

    `confidence` and `explanation` are not optional and not decorative: the spec
    requires every AI output to carry a score and a "why the AI thinks this"
    before a human is asked to act on it.
    """

    kind: str
    payload: dict[str, Any]
    confidence: float
    explanation: str
    sources: list[SourceRef] = field(default_factory=list)
    provider: str = "mock"
    model: str | None = None
    # True only when a real language model produced this.
    is_live_inference: bool = False


class AIProvider(ABC):
    """Contract every provider must satisfy."""

    name: str = "abstract"
    model: str | None = None
    is_live_inference: bool = False

    @abstractmethod
    def extract(self, *, text: str, context: dict[str, Any]) -> list[AIResult]:
        """Pull structured facts out of one piece of evidence.

        Every returned fact must carry an excerpt that literally occurs in
        `text`. The extraction service re-checks this and drops anything that
        fails, so a provider cannot smuggle an unattributable claim through.
        """

    @abstractmethod
    def compare(
        self, *, new_item: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        """Find contradictions between new evidence and the existing case."""

    @abstractmethod
    def guide(
        self, *, case_context: dict[str, Any], kb_hits: list[dict[str, Any]]
    ) -> list[AIResult]:
        """Suggest next steps, each citing a rule from the curated KB."""

    @abstractmethod
    def medical_crossref(
        self, *, report: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        """Cross-check post-mortem findings against the timeline.

        Produces investigative hypotheses only. Implementations must never emit
        a cause-of-death determination.
        """

    @abstractmethod
    def chargesheet_qa(
        self, *, chargesheet: dict[str, Any], case_context: list[dict[str, Any]]
    ) -> list[AIResult]:
        """Check chargesheet claims against the verified timeline."""

    def describe(self) -> dict[str, Any]:
        """Shown in the UI badge and stored on every job."""
        return {
            "provider": self.name,
            "model": self.model,
            "is_live_inference": self.is_live_inference,
            "disclaimer": (
                "Deterministic rule-based analysis, not a language model. "
                "Results are reproducible and offline."
                if not self.is_live_inference
                else "Live language-model inference."
            ),
        }
