# Chain of Truth

**An AI-assisted evidence integrity and investigation system for police and judiciary.**

> **AI assists. Humans decide.**
> The AI never makes a legal determination, never files anything, and is never
> treated as ground truth.

<!-- ─────────────────────────────────────────────────────────────────────────
     FILL THESE IN BEFORE SUBMITTING — replace the placeholder text only.
     ───────────────────────────────────────────────────────────────────────── -->

| | |
| --- | --- |
| **Live demo** | _paste deployed URL here_ |
| **Demo video** | _paste video link here (YouTube / Drive / Loom)_ |
| **Repository** | https://github.com/lisamehta0791/Chain_of_truth |
| **Team** | Byte Me |

---

## Screenshots

### Landing — cinematic opening
![Landing](docs/screenshots/01-landing.png)

### Command Center — case summary, live counters, quick actions
![Command Center](docs/screenshots/02-command-center.png)

### Evidence Vault — hash-sealed items, two-person confirmation
![Evidence Vault](docs/screenshots/03-evidence-vault.png)

### Case Timeline — verified facts and AI events, interleaved but never merged
![Case Timeline](docs/screenshots/04-case-timeline.png)

### Evidence Graph — every edge is a real relationship from the case file
![Evidence Graph](docs/screenshots/05-evidence-graph.png)

### Forensic Map — real street map with the derived movement route
![Forensic Map](docs/screenshots/06-forensic-map.png)

### Autopsy Cross-Check — rotatable 3D anatomical viewer
![Autopsy Cross-Check](docs/screenshots/07-autopsy-3d.png)

### Investigation Guidance — checklist grounded in BNS / CrPC
![Investigation Guidance](docs/screenshots/08-investigation-guidance.png)

### Evidence Gaps — what the case is missing, and the next step
![Evidence Gaps](docs/screenshots/09-evidence-gaps.png)

### Statement Reliability — what changed between two accounts
![Statement Reliability](docs/screenshots/10-statement-reliability.png)

### Digital Evidence Correlation — tower and CCTV against the timeline
![Digital Correlation](docs/screenshots/11-digital-correlation.png)

### Case Similarity — method overlap, explicitly not proof
![Case Similarity](docs/screenshots/12-case-similarity.png)

### Human Verification — every AI finding waiting on a person
![Review Queue](docs/screenshots/13-review-queue.png)

### Case Closure Readiness — the score, with its arithmetic shown
![Closure Readiness](docs/screenshots/14-closure-readiness.png)

### Chargesheet QA — pre-filing consistency check
![Chargesheet QA](docs/screenshots/15-chargesheet-qa.png)

### Audit Trail — append-only, hash-chained, records views not just edits
![Audit Trail](docs/screenshots/16-audit-trail.png)

---

## The problem

When a crime happens, evidence arrives scattered — a photo here, a witness statement
there, a forensic report weeks later, often logged by different officers who never
cross-reference each other's work. Cases collapse in court on technicalities that have
nothing to do with guilt or innocence. India's CCTNS and ICJS digitize records, but
neither *reasons* over the evidence to catch gaps and contradictions as a case builds.

Chain of Truth is a case-management platform where every piece of evidence is logged the
moment it is collected, permanently and verifiably timestamped, with an AI layer on top
that reads it, connects it, and catches contradictions — while every AI output stays a
suggestion for a human to verify, never an automatic decision.

---

## The core principle, expressed as architecture

This is not a slogan bolted onto a dashboard. It is enforced in three places:

| Layer | How the principle is enforced |
| --- | --- |
| **Database** | AI output and verified facts live in **physically separate tables**. An extracted fact cannot be read by a query against the verified record until a human writes a `verification_decisions` row promoting it. |
| **Service** | `services/analysis.py` can only write to the AI layer. Only `services/verification.py`, driven by a human action, can promote anything. The asymmetry is structural, not conventional. |
| **UI** | Six status chips (`VERIFIED`, `AI-EXTRACTED · UNVERIFIED`, `AI HYPOTHESIS`, `HUMAN-CONFIRMED`, `DISMISSED`, `REQUIRES REVIEW`) each carry an icon and a word, never colour alone. Every AI finding renders beside the exact source text it came from. |

Dismissing a flag never deletes it. A court sees both what the machine noticed and what
the officer decided about it — that is the due-diligence log the system is built to
produce.

---

## Architecture

```
frontend/  Next.js 16 · React 19 · TypeScript · Tailwind v4 (dark + light) · Motion · R3F
backend/   FastAPI · SQLAlchemy 2.0 · deterministic + pluggable AI · RAG over pgvector
docker/    PostgreSQL 16 + pgvector · MinIO (S3-compatible object storage)
docs/      Setup, security, demo script, integration notes
scripts/   PowerShell helpers for the local stack
```

### Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript | Route-level code splitting keeps 3D and map chunks out of the initial load |
| Styling | Tailwind CSS v4 · dark + light themes | Design tokens from the Stitch `forensic_command` system |
| Animation | `motion` v13 | Motion communicates state changes; every primitive honours `prefers-reduced-motion` |
| 3D | three.js · @react-three/fiber · @react-three/drei | Anatomical viewer and the landing evidence network; lazily imported |
| Graph | Custom canvas force simulation | Cools and settles rather than drifting; no second WebGL context |
| Map | Custom canvas slippy map over OpenStreetMap tiles | Real streets, no API key, falls back to a coordinate grid offline |
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2.0 | Modular routes → services → models |
| Database | PostgreSQL 16 + pgvector 0.8 | Relational, vector and graph storage in one engine |
| Object storage | MinIO (S3-compatible) | Evidence files, versioning enabled |
| Embeddings | `fastembed` (optional) → hashed lexical fallback | Runs offline with zero installs; upgrades to semantic when installed |
| LLM | Provider interface: `mock` \| `groq` \| `xai` \| `anthropic` | Demo runs offline; live inference is one env var away, and a fallback is announced, never silent |

### Deliberate honesty in the stack

- **Hashing is cryptography, not AI.** Tamper-proofing must be deterministic and
  provably reliable, so no model touches it.
- **Location scoring is rule-based, not ML.** Every region exposes
  `weight × value = contribution` for each factor.
- **The AI provider is explicit about what ran.** With `COT_AI_PROVIDER=groq` the UI
  shows `AI: LIVE`; the deterministic fallback shows `AI: MOCK`. A silent downgrade is
  impossible — the badge reflects the provider that actually produced the output, and
  `scripts/check_ai.py` exits non-zero if the configured provider is not the one running.
- **The embedding fallback is lexical, not semantic.** It matches wording, not meaning,
  and `describe()` says so rather than implying neural embeddings.


### Using Groq for live inference

The system ships configured for Groq. Add your key to `.env` in the repo root:

```dotenv
COT_AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
COT_GROQ_MODEL=llama-3.3-70b-versatile
```

Get a key at <https://console.groq.com/keys> (the free tier is enough for the demo).
Then verify — **before** you demo, not during it:

```powershell
cd backend
python scripts\check_ai.py --models   # which models your key can reach
python scripts\check_ai.py --live     # run a real extraction end to end
```

`check_ai.py` exits non-zero if `groq` is configured but the deterministic provider is
what would actually run, so a silent fallback cannot go unnoticed.

**Hallucination is contained by construction, not by prompt.** The model is instructed to
quote verbatim; `groq_provider.py` then drops any fact whose value is not a literal
substring of the source; and `services/analysis.py` re-verifies the character offsets
independently before anything is written. A model that paraphrases produces zero facts
rather than unattributable ones. Guidance citations are resolved against the curated
knowledge base, so an invented section number resolves to no citation at all.

---

## Features

### P0 — fully working
- Evidence ingestion (file + text), SHA-256 hashing, hash-chained ledger
- Two-person confirmation for physical evidence, enforced with Ed25519 signatures
- Device metadata captured and **locked** at upload, cross-checked against officer shift
- Structured entity extraction with **exact character offsets** into the source
- Minute-precision contradiction detection with both conflicting excerpts
- Confirm / Dismiss / Request-review gate, recorded permanently either way
- Shared verified case timeline, ordered by event time (not upload time)
- Evidence graph, RAG retrieval, audit trail on every **view** (not just edits)
- Role-based access control across four officer roles

### P1
- Investigation Guidance Agent — RAG over a curated BNS/CrPC knowledge base, every
  suggestion citing a section that is validated against the KB before display
- Evidence gap detection, Case Closure Readiness with a transparent factor breakdown

### P2 / additional
- Autopsy cross-check with region-bound findings and a mandatory hypothesis disclaimer
- Chargesheet QA (`PASS` / `WARNING` / `CONFLICT` / `MISSING SUPPORT`)
- Predictive location with explainable geospatial scoring
- Statement reliability (version diffing), digital evidence correlation,
  case similarity search, multi-language statement handling, offline-first sync

---

## Quick start

Full walkthrough in **[docs/SETUP.md](docs/SETUP.md)**. Short version, from the repo root:

```powershell
# 1. Database + object storage
Copy-Item .env.example .env
.\scripts\dev-up.ps1
.\scripts\db-verify.ps1        # expects pgvector 0.8.x

# 2. Backend
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
python scripts\seed_demo.py --reset     # evidence, ledger, custody, audit
python scripts\seed_analysis.py         # KB, AI analysis, autopsy, location...
python -m uvicorn app.main:app --reload --port 8000

# 3. Frontend (NEW terminal, starting from the repo root)
cd frontend
npm install
npm run dev
```

If a path error or a port clash gets in the way, use the helper scripts instead.
They resolve paths from the script location, so they work **from any directory**,
and they stop a stale server on the port first:

```powershell
.\scripts\run-backend.ps1     # API on :8000
.\scripts\run-frontend.ps1    # web on :3000
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| API docs (OpenAPI) | http://localhost:8000/docs |
| MinIO console | http://localhost:9001 |

Sign in at `/login` with any of the four seeded demo officers — the role you pick
changes what you are permitted to do.

---

## Testing

```powershell
cd backend
python -m pytest tests -q          # 123 tests

cd ..\frontend
npm run typecheck                     # tsc --noEmit
npm run build                         # type errors fail the build
```

---

## Demo flow

The seed deliberately **leaves the conflicting witness statement out**, so the
contradiction can be created live on stage. See
**[docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)**.

1. Upload a witness statement saying the suspect left *"at about 9:00 PM"*
2. Evidence registers → SHA-256 computed → hash chain extends (visible in 3D)
3. AI extraction runs → entities appear tagged `AI-EXTRACTED · UNVERIFIED`, each beside
   its exact source text
4. CCTV metadata already in the case says **21:47** → a `MAJOR` time conflict is flagged,
   47 minutes apart, with both excerpts and a confidence score
5. Officer confirms or dismisses → recorded permanently, with the reason
6. Verified timeline updates; readiness score moves; guidance suggests the next
   procedural step, citing a real CrPC section

One upload visibly changes five panels — that connected behaviour is the thing to
demonstrate.

---

## Security

- Role-based access control: Investigating Officer / Supervisor / Forensic Reviewer /
  Legal Reviewer, enforced by a FastAPI dependency (the hidden button is UX; the API
  check is the control)
- Append-only, self-hash-chained audit log covering views, not just edits
- Victim/witness PII restricted by role; `is_protected` marks records for redaction
- Evidence integrity: SHA-256 content hashes, chained ledger entries, Ed25519 signatures
- Secrets exclusively from environment variables; `.env` is gitignored

See **[docs/SECURITY.md](docs/SECURITY.md)**.

---

## Limitations — stated deliberately

A tool for criminal justice should be honest about what it does not do.

- **The hash chain proves records were not altered after upload.** It does not prove that
  what was originally recorded was true. Two-person confirmation and locked device
  metadata raise the bar from "one person can fake this alone" to "several independent
  signals must be falsified together" — that is a real improvement, not a guarantee.
- **The default analyser is deterministic and rule-based**, not a language model. It will
  miss contradictions that require semantic understanding.
- **The embedding fallback is lexical.** Install `fastembed` for semantic retrieval.
- **Location scoring is a heuristic** for prioritising search areas. It is not a
  prediction of where a person is.
- **Autopsy output is an investigative hypothesis**, never a diagnosis or a
  cause-of-death conclusion. It exists to flag gaps for a forensic medical officer.
- **Encryption at rest** uses a development key file locally, not an HSM.
- **Offline sync** is demo-grade: the queue and hash-preservation logic are real, but it
  has not been hardened for prolonged disconnection or conflict resolution.
- **The frontend currently runs on an in-memory demo store** seeded from
  `lib/mock-data`. The FastAPI backend implements the full specification and is
  independently tested; wiring the two together is remaining work.
- **Demo data is entirely fictional.** No real person's information appears anywhere.

---

## How this differs from CCTNS / ICJS

CCTNS and ICJS are record-keeping and data-sharing systems. They store what is entered;
they do not read it, connect it, or flag problems within it. Chain of Truth is designed
as an active reasoning layer that sits **on top of** that kind of infrastructure — it
complements the data backbone rather than competing with it.

---

## Documentation

| Document | Contents |
| --- | --- |
| [docs/SETUP.md](docs/SETUP.md) | Installation, Docker, database, troubleshooting |
| [docs/SECURITY.md](docs/SECURITY.md) | RBAC, encryption, audit, trust boundary |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Live demo walkthrough and judge Q&A |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | How the agent layer wires into the ledger |
| [docker/README.md](docker/README.md) | Container stack reference |

## License

MIT — see [LICENSE](LICENSE).
