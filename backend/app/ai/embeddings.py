"""Embeddings behind an interface, with an honest offline default.

Two implementations:

  FastEmbedProvider  -- BAAI/bge-small-en-v1.5 via `fastembed` (ONNX, ~50 MB, no
                        PyTorch, no API key). Real semantic embeddings. Used
                        automatically when the package is installed.

  HashingEmbedder    -- a deterministic hashed bag-of-character-ngrams vector.
                        This is genuine lexical similarity, NOT semantic
                        similarity: it will match "knife wound" to "knife
                        wounds" but not to "stab injury". It exists so the whole
                        RAG pipeline runs with zero installs and zero network,
                        and it says so in `describe()` rather than pretending to
                        be a neural model.

Both produce unit-norm vectors of the same dimension, so cosine similarity is
just a dot product and the two are interchangeable at the storage layer.
"""
from __future__ import annotations

import hashlib
import math
import os
import re
from abc import ABC, abstractmethod
from typing import Any

DEFAULT_DIM = 384

_TOKEN_RE = re.compile(r"[a-z0-9]+")


class EmbeddingProvider(ABC):
    name: str = "abstract"
    dim: int = DEFAULT_DIM
    is_semantic: bool = False

    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch. Returns one unit-norm vector per input."""

    def embed_one(self, text: str) -> list[float]:
        return self.embed([text])[0]

    def describe(self) -> dict[str, Any]:
        return {
            "provider": self.name,
            "dimensions": self.dim,
            "semantic": self.is_semantic,
            "note": (
                "Neural sentence embeddings."
                if self.is_semantic
                else "Lexical hashed n-gram vectors - matches wording, not meaning. "
                "Install `fastembed` for semantic retrieval."
            ),
        }


def _normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in vec))
    if norm == 0.0:
        return vec
    return [v / norm for v in vec]


class HashingEmbedder(EmbeddingProvider):
    """Hashed lexical features. Deterministic, offline, dependency-free."""

    name = "hashing-lexical-v1"
    is_semantic = False

    def __init__(self, dim: int = DEFAULT_DIM):
        self.dim = dim

    def _features(self, text: str) -> list[str]:
        tokens = _TOKEN_RE.findall(text.lower())
        feats: list[str] = list(tokens)
        # Word bigrams capture a little word order ("left at nine" vs "nine at left").
        feats.extend(f"{a}_{b}" for a, b in zip(tokens, tokens[1:]))
        # Character 4-grams give partial robustness to morphology and typos.
        joined = " ".join(tokens)
        feats.extend(joined[i : i + 4] for i in range(max(0, len(joined) - 3)))
        return feats

    def embed(self, texts: list[str]) -> list[list[float]]:
        out: list[list[float]] = []
        for text in texts:
            vec = [0.0] * self.dim
            for feat in self._features(text or ""):
                digest = hashlib.blake2b(feat.encode("utf-8"), digest_size=8).digest()
                bucket = int.from_bytes(digest[:4], "big") % self.dim
                # Signed hashing keeps unrelated collisions from all adding up.
                sign = 1.0 if digest[4] & 1 else -1.0
                vec[bucket] += sign
            out.append(_normalize(vec))
        return out


class FastEmbedProvider(EmbeddingProvider):
    """Real semantic embeddings via fastembed, when it is installed."""

    is_semantic = True

    def __init__(self, model_name: str | None = None, dim: int = DEFAULT_DIM):
        from fastembed import TextEmbedding  # imported lazily on purpose

        self.model_name = model_name or os.getenv(
            "COT_EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5"
        )
        self.name = f"fastembed:{self.model_name}"
        self.dim = dim
        self._model = TextEmbedding(model_name=self.model_name)

    def embed(self, texts: list[str]) -> list[list[float]]:
        vectors = list(self._model.embed(texts))
        return [_normalize([float(x) for x in v]) for v in vectors]


_cached: EmbeddingProvider | None = None


def get_embedder(force: str | None = None) -> EmbeddingProvider:
    """Return the process-wide embedder.

    Prefers fastembed when available; falls back to hashing rather than failing,
    because an unavailable optional dependency must not take the demo down.
    """
    global _cached
    if _cached is not None and force is None:
        return _cached

    choice = (force or os.getenv("COT_EMBEDDING_BACKEND", "auto")).lower()
    dim = int(os.getenv("COT_EMBEDDING_DIM", str(DEFAULT_DIM)))

    if choice in ("auto", "fastembed"):
        try:
            provider: EmbeddingProvider = FastEmbedProvider(dim=dim)
        except Exception:
            if choice == "fastembed":
                raise
            provider = HashingEmbedder(dim=dim)
    else:
        provider = HashingEmbedder(dim=dim)

    if force is None:
        _cached = provider
    return provider


def cosine(a: list[float], b: list[float]) -> float:
    """Cosine similarity. Inputs are unit-norm, so this is a dot product."""
    if not a or not b or len(a) != len(b):
        return 0.0
    return sum(x * y for x, y in zip(a, b))
