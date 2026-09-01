"""Provider selection. One place decides which adapter is in play."""
from __future__ import annotations

import logging
import os

from .provider import AIProvider
from .providers.mock import MockProvider

log = logging.getLogger(__name__)

_cached: AIProvider | None = None
_last_fallback_reason: str | None = None


def get_provider(force: str | None = None) -> AIProvider:
    """Resolve the configured provider.

    Falls back to the deterministic provider whenever a live one cannot be
    constructed -- missing key, missing package, no network. A demo that dies
    because an API key expired is worse than one that is honest about running
    offline, and the UI badge always reflects what actually ran rather than what
    was configured.

    The fallback is logged loudly and exposed via `fallback_reason()`, so a
    silent downgrade never passes unnoticed.
    """
    global _cached, _last_fallback_reason
    if _cached is not None and force is None:
        return _cached

    choice = (force or os.getenv("COT_AI_PROVIDER", "mock")).strip().lower()
    provider: AIProvider
    reason: str | None = None

    if choice in ("groq", "xai", "llm"):
        try:
            from .providers.groq_provider import GroqProvider

            provider = GroqProvider()
            log.info("AI provider: groq (model=%s)", provider.model)
        except Exception as exc:
            reason = f"Groq unavailable ({exc}); using deterministic provider"
            log.warning("AI provider fallback: %s", reason)
            provider = MockProvider()

    elif choice == "anthropic":
        try:
            from .providers.anthropic_provider import AnthropicProvider

            provider = AnthropicProvider()
        except Exception as exc:
            reason = f"Anthropic unavailable ({exc}); using deterministic provider"
            log.warning("AI provider fallback: %s", reason)
            provider = MockProvider()

    else:
        provider = MockProvider()

    if force is None:
        _cached = provider
        _last_fallback_reason = reason
    return provider


def fallback_reason() -> str | None:
    """Why the configured provider was not used, if it was not."""
    return _last_fallback_reason


def reset_cache() -> None:
    """Test hook, and the way to pick up a changed .env without a restart."""
    global _cached, _last_fallback_reason
    _cached = None
    _last_fallback_reason = None
