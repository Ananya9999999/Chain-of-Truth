# Chain of Truth

**AI assists investigators. It does not determine guilt.**

When a crime occurs, evidence arrives piecemeal — a photo from one officer, a witness statement from another, a forensic report weeks later — often logged by people who never compare notes. Cases collapse in court on technicalities unrelated to actual guilt or innocence.

India already has strong digitization systems (**CCTNS**, **ICJS**). They are excellent systems of record. They store what is entered; they do not read it, cross-reference it, or surface contradictions as a case develops.

**Chain of Truth** is the active reasoning layer on top — not a replacement for government infrastructure.

> Every AI output is a suggestion. A human officer must confirm or dismiss it before it enters the official case record. Courts only ever see the verified record, plus a transparent log of what the AI flagged and how officers responded.

---

## What's included

| Layer | Capability |
| --- | --- |
| **Part 1 — Integrity** | Evidence upload, SHA-256 hash chain, two-person confirmation (Ed25519), locked device metadata, audit trail on every access, offline-first sync |
| **Part 3 — AI agents** | Timeline candidates, contradiction detector, investigation guidance (curated BNS/CrPC KB), autopsy hypothesis agent, chargesheet pre-filing QA |
| **Part 5 — Security & demo** | RBAC helpers (officer / supervisor / forensic / legal), security model, live demo script, judge Q&A |
| **Frontend** | Next.js dashboard (timeline, evidence, contradictions, guidance, location, audit) |
| **Tests** | 100+ automated tests including adversarial tamper checks |

Tamper-proofing is **cryptographic**, not probabilistic. AI never files, never auto-confirms, and never becomes ground truth.

---

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: http://localhost:8000/health
- API docs: http://localhost:8000/docs
- API prefix: `/api/v1`

Identify the acting officer on every request:

```
X-Officer-Id: 1
# or
X-Badge-Number: DEL-1042
```

### Seed demo data

```bash
cd backend
python scripts/seed_demo.py
```

### Frontend

```bash
cd frontend
pnpm install   # or npm install
pnpm dev       # http://localhost:3000
```

Point the UI at the backend via env if needed (`NEXT_PUBLIC_API_URL=http://localhost:8000`).

---

## Agent API (Part 3)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/cases/{id}/guidance` | Investigation checklist (BNS/CrPC grounded) |
| GET | `/api/v1/cases/{id}/autopsy-analysis` | Autopsy hypotheses — medical review required |
| POST | `/api/v1/cases/{id}/chargesheet-qa` | Pre-filing QA checklist |
| GET | `/api/v1/cases/{id}/analysis` | Timeline + contradictions + guidance |
| GET | `/api/v1/legal-kb` | Transparency: curated legal knowledge base |

All AI responses carry explicit **unverified / hypothesis** labels.

---

## Project layout

```
backend/
  app/
    api/           # routes + deps + deps_rbac + routes_agents
    core/          # signing, canonical JSON, locks
    services/      # evidence, ledger, audit, sync, ai_engine
    models.py schemas.py database.py main.py
  scripts/         # seed_demo, self_check
  tests/           # hash chain, two-person, audit, adversarial, …
frontend/          # Next.js App Router dashboard
docs/
  INTEGRATION.md
  DEMO_SCRIPT.md
  SECURITY.md
```

---

## Docs

- `docs/DEMO_SCRIPT.md` — 3–4 minute live demo + judge objections
- `docs/SECURITY.md` — roles, encryption, trust boundary
- `docs/INTEGRATION.md` — how agents were wired into the ledger
- `backend/README.md` — Part 1 ledger details

---

## Principle (never relax)

1. AI never makes a legal determination and never files automatically.
2. Verified case record ≠ AI working analysis layer.
3. Courts see verified evidence + the transparent log of AI flags and officer responses.
4. Complements CCTNS/ICJS; does not replace them.

---

## Disclaimer

Built for hackathon demonstration and architecture review. Production deployment requires formal legal review of the guidance knowledge base, hardened authentication, and integration adapters for official systems of record.
