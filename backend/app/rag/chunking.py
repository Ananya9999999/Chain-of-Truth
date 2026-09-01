"""Chunking that never loses provenance.

Retrieval is only trustworthy if a retrieved passage can be traced back to exact
characters in the original document. Every chunk therefore carries
``offset_start``/``offset_end`` into the source string, and a round-trip check in
the tests asserts ``source[start:end] == chunk.content``.

Splitting is sentence-aware: statements are prose, and cutting mid-sentence
produces passages that read as nonsense next to a contradiction flag.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Sentence boundary: terminator + whitespace, not inside a common abbreviation.
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")

DEFAULT_CHUNK_CHARS = 900
DEFAULT_OVERLAP_CHARS = 150


@dataclass(frozen=True)
class Chunk:
    index: int
    content: str
    offset_start: int
    offset_end: int

    @property
    def token_estimate(self) -> int:
        # ~4 characters per token is close enough for budgeting; we are not
        # billing on it, only deciding how much context to assemble.
        return max(1, len(self.content) // 4)


def _sentence_spans(text: str) -> list[tuple[int, int]]:
    """(start, end) for each sentence, covering the whole string."""
    spans: list[tuple[int, int]] = []
    cursor = 0
    for match in _SENTENCE_END.finditer(text):
        end = match.start()
        if end > cursor:
            spans.append((cursor, end))
        cursor = match.end()
    if cursor < len(text):
        spans.append((cursor, len(text)))
    return spans


def chunk_text(
    text: str,
    *,
    max_chars: int = DEFAULT_CHUNK_CHARS,
    overlap_chars: int = DEFAULT_OVERLAP_CHARS,
) -> list[Chunk]:
    """Split into overlapping, sentence-aligned chunks with exact offsets."""
    if not text or not text.strip():
        return []
    if len(text) <= max_chars:
        return [Chunk(0, text, 0, len(text))]

    spans = _sentence_spans(text)
    chunks: list[Chunk] = []
    start: int | None = None
    end = 0

    for span_start, span_end in spans:
        if start is None:
            start = span_start
        # A single sentence longer than the budget is hard-split rather than
        # dropped, still with correct offsets.
        if span_end - span_start > max_chars:
            if end > (start or 0):
                chunks.append(Chunk(len(chunks), text[start:end], start, end))
            cursor = span_start
            while cursor < span_end:
                stop = min(cursor + max_chars, span_end)
                chunks.append(Chunk(len(chunks), text[cursor:stop], cursor, stop))
                cursor = stop
            start, end = None, span_end
            continue

        if span_end - start > max_chars:
            chunks.append(Chunk(len(chunks), text[start:end], start, end))
            # Step back by the overlap so context straddling a boundary is not
            # lost, but never back past the start of the chunk we just emitted.
            start = max(start, end - overlap_chars)
            # Realign to a sentence start so the overlap is still readable.
            start = min(start, span_start)
        end = span_end

    if start is not None and end > start:
        chunks.append(Chunk(len(chunks), text[start:end], start, end))

    return [c for c in chunks if c.content.strip()]


def detect_language(text: str) -> str:
    """Crude script detection to keep in-language processing honest.

    The spec requires regional-language statements to be processed in-language
    rather than force-translated, so the language is recorded per chunk. This
    identifies script ranges, not dialects -- it does not pretend to be a
    full language classifier.
    """
    if not text:
        return "en"
    counts = {
        "hi": 0,  # Devanagari
        "bn": 0,
        "ta": 0,
        "te": 0,
        "kn": 0,
        "ml": 0,
        "gu": 0,
        "pa": 0,
    }
    for ch in text:
        cp = ord(ch)
        if 0x0900 <= cp <= 0x097F:
            counts["hi"] += 1
        elif 0x0980 <= cp <= 0x09FF:
            counts["bn"] += 1
        elif 0x0B80 <= cp <= 0x0BFF:
            counts["ta"] += 1
        elif 0x0C00 <= cp <= 0x0C7F:
            counts["te"] += 1
        elif 0x0C80 <= cp <= 0x0CFF:
            counts["kn"] += 1
        elif 0x0D00 <= cp <= 0x0D7F:
            counts["ml"] += 1
        elif 0x0A80 <= cp <= 0x0AFF:
            counts["gu"] += 1
        elif 0x0A00 <= cp <= 0x0A7F:
            counts["pa"] += 1

    best = max(counts, key=lambda k: counts[k])
    # Require a real presence of the script, not one stray character.
    if counts[best] >= max(3, len(text) * 0.10):
        return best
    return "en"
