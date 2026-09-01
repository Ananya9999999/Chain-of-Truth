"""Verify the configured AI provider before you rely on it in a demo.

    python scripts/check_ai.py            # check whatever COT_AI_PROVIDER says
    python scripts/check_ai.py --models   # also list models this key can reach
    python scripts/check_ai.py --live     # run a real extraction end to end

Exits non-zero if the configured provider is NOT the one that would actually
run, so this is safe to put in front of a demo or in CI. Finding out on stage
that you silently fell back to the deterministic provider is the failure mode
this script exists to prevent.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def load_dotenv() -> None:
    """Minimal .env loader so this script works without extra dependencies.

    Existing environment variables win, matching how uvicorn would see them.
    """
    env_path = REPO_ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--models", action="store_true", help="list reachable models")
    parser.add_argument("--live", action="store_true", help="run a real extraction")
    args = parser.parse_args()

    load_dotenv()

    from app.ai.registry import fallback_reason, get_provider, reset_cache

    configured = os.getenv("COT_AI_PROVIDER", "mock").strip().lower()
    key = (
        os.getenv("GROQ_API_KEY")
        or os.getenv("XAI_API_KEY")
        or os.getenv("COT_LLM_API_KEY")
        or ""
    ).strip()

    print("Chain of Truth - AI provider check")
    print("=" * 60)
    print(f"  COT_AI_PROVIDER : {configured}")
    print(f"  COT_GROQ_MODEL  : {os.getenv('COT_GROQ_MODEL', '(default)')}")
    if configured in ("groq", "xai", "llm"):
        if key:
            from app.ai.providers.groq_provider import VENDORS, detect_vendor

            vendor = detect_vendor(key)
            print(f"  detected vendor : {vendor}  ({VENDORS[vendor]['base']})")
            if key.startswith("xai-") and configured == "groq":
                print("  NOTE            : this is an xAI key, not a Groq key -")
                print("                    Groq keys start with gsk_. Routing to xAI.")
            # Never print a secret. Length and prefix are enough to tell whether
            # the right value landed in the file.
            print(f"  GROQ_API_KEY    : set ({len(key)} chars, starts '{key[:4]}…')")
        else:
            print("  GROQ_API_KEY    : NOT SET")

    if args.models and configured in ("groq", "xai", "llm"):
        print("\nModels reachable with this key:")
        try:
            from app.ai.providers.groq_provider import list_models

            for model in list_models():
                print(f"  - {model}")
        except Exception as exc:
            print(f"  could not list models: {exc}")

    reset_cache()
    provider = get_provider()
    info = provider.describe()

    print("\nProvider actually in use:")
    print(f"  name            : {info['provider']}")
    print(f"  model           : {info['model']}")
    print(f"  live inference  : {info['is_live_inference']}")
    print(f"  UI badge        : AI: {'LIVE' if info['is_live_inference'] else 'MOCK'}")

    reason = fallback_reason()
    if reason:
        print(f"\n  !! FELL BACK: {reason}")

    if args.live:
        print("\nLive extraction test:")
        sample = (
            "Witness Ramesh Kumar states the suspect left the shop at 9:00 PM "
            "on 29 August 2026 near MG Road market. A knife was visible."
        )
        try:
            facts = provider.extract(
                text=sample, context={"evidence_id": 1, "evidence_uid": "test"}
            )
            print(f"  extracted {len(facts)} facts")
            anchored = 0
            for f in facts:
                src = f.sources[0] if f.sources else None
                value = f.payload.get("value", "")
                ok = (
                    src is not None
                    and src.offset_start is not None
                    and sample[src.offset_start : src.offset_end] == value
                )
                anchored += 1 if ok else 0
                print(
                    f"    {'OK ' if ok else 'BAD'} {f.payload.get('fact_type', ''):<10}"
                    f" {value!r} (conf {f.confidence:.2f})"
                )
            print(f"  {anchored}/{len(facts)} anchored byte-exact to the source")
            if facts and anchored != len(facts):
                print("  !! unanchored facts would be DROPPED before reaching the DB")
        except Exception as exc:
            print(f"  extraction failed: {exc}")
            return 1

    mismatch = configured in ("groq", "xai", "llm", "anthropic") and not info["is_live_inference"]
    if mismatch:
        print(
            f"\nRESULT: FAIL - '{configured}' was configured but the deterministic "
            "provider is what will actually run."
        )
        return 1

    print("\nRESULT: OK - the configured provider is the one that will run.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
