<<<<<<< HEAD
# Chain of Truth — Part 3 + Part 5 package

**Part 3:** Investigation Guidance Agent · Autopsy Agent · Chargesheet QA Agent · curated BNS/CrPC KB  
**Part 5:** RBAC helpers · Security model · Integration guide · Live demo script · Demo UI

Drop these files into the existing **Part 1** backend (`Chain-of-Truth-main`).

## Quick integrate

See **`docs/INTEGRATION.md`**.

```bash
cp backend/app/services/ai_engine.py   <part1-repo>/backend/app/services/
cp backend/app/api/routes_agents.py    <part1-repo>/backend/app/api/
cp backend/app/api/deps_rbac.py        <part1-repo>/backend/app/api/
# then mount routes_agents.router in main.py (one include_router line)
```

## API surface (after mount under `/api`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/cases/{id}/guidance` | Investigation checklist (BNS/CrPC grounded) |
| GET | `/api/cases/{id}/autopsy-analysis` | Autopsy hypotheses (medical review required) |
| POST | `/api/cases/{id}/chargesheet-qa` | Pre-filing QA checklist |
| GET | `/api/cases/{id}/analysis` | Timeline + contradictions + guidance |
| GET | `/api/legal-kb` | Transparency: curated legal KB |

All AI responses carry explicit **unverified / hypothesis** labels.

## Principle

> AI assists. Humans decide.  
> Courts only see the verified record + the log of AI flags and officer responses.

## Docs

- `docs/INTEGRATION.md` — how to wire into Part 1  
- `docs/DEMO_SCRIPT.md` — 3–4 min live demo + judge Q&A  
- `docs/SECURITY.md` — RBAC, encryption, trust boundary  
=======
# Chain of Truth

**An AI-assisted evidence integrity and investigation system for police and judiciary.**

When a crime happens, evidence arrives scattered — a photo here, a witness
statement there, a forensic report weeks later, often logged by different
officers who never cross-reference each other's work. Cases collapse in court on
technicalities that have nothing to do with guilt or innocence.

Chain of Truth is a case-management platform where every piece of evidence is
logged the moment it is collected, permanently and verifiably timestamped, with
an AI layer on top that reads it, connects it, and catches contradictions —
while **every AI output stays a suggestion for a human to verify, never an
automatic decision**.

> AI assists investigators. It does not determine guilt.
> All conclusions require human verification.

---

## What is in this repository

This repo contains **Part 1 — the Backend & Tamper-Proof Ledger**: the evidence
integrity layer everything else is built on.

| Feature | What it does |
| --- | --- |
| **Evidence upload API** | Files and text statements, hashed on arrival |
| **SHA-256 hash chain** | Each entry commits to the previous one, so editing history is mathematically detectable |
| **Two-person confirmation** | Collecting officer + witnessing officer, enforced with Ed25519 signatures |
| **Locked device metadata** | Capture GPS / device ID / timestamp frozen at upload and cross-checked against the officer's logged shift |
| **Audit trail** | Every view and access is logged, not just edits — and the log is itself hash-chained |
| **Offline-first sync** | Log evidence with no connectivity; original timestamps and hashes survive the sync |

There is **deliberately no AI in this layer**. Tamper-proofing is cryptographic
hashing, which needs to be deterministic and provably reliable rather than
probabilistic.

**113 automated tests**, including tests that actively tamper with the database
and assert the system catches it.

---

## Quick start

**Requires Python 3.11 or newer.** (Tested on 3.12 and 3.14.)

### 1. Clone and set up

```bash
git clone https://github.com/lisamehta0791/Chain-of-Truth.git
cd Chain-of-Truth
```

Create a virtual environment and install the dependencies:

<details open>
<summary><strong>Windows (PowerShell)</strong></summary>

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

If PowerShell blocks the activate script, run this once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
</details>

<details>
<summary><strong>macOS / Linux</strong></summary>

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```
</details>

### 2. Load the demo case

```bash
cd backend
python scripts/seed_demo.py --reset
```

This creates four officers, a case (`CR-2026-0042`, a burglary), and five
evidence items — four confirmed, one left waiting for a second officer so you
can see the confirmation queue.

### 3. Run the server

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Open **<http://127.0.0.1:8000/docs>** for interactive API documentation with a
*Try it out* button on every endpoint.

Every request needs an officer identity header — there is a box for it on each
endpoint:

```
X-Officer-Id: 1
```

`1` is Insp. Anita Rao (the investigating officer), `2` is SI Bhaskar Nair (the
supervisor). Stop the server with **Ctrl+C**.

---

## Try it in two minutes

With the server running and the demo case seeded, in the `/docs` page:

| Endpoint | What you will see |
| --- | --- |
| `GET /api/v1/cases/1/ledger` | The hash chain. Each entry's `prev_hash` equals the previous entry's `entry_hash`. |
| `GET /api/v1/cases/1/ledger/verify` | `"valid": true` — reached by recomputing every hash from genesis, not by reading a flag. |
| `GET /api/v1/cases/1/evidence/pending` | The item still awaiting a second officer. Copy its `uid`. |
| `POST /api/v1/evidence/{uid}/confirm` with `X-Officer-Id: 1` | **409 refused** — officer 1 logged it, so they cannot confirm it. That is the two-person rule. |
| The same call with `X-Officer-Id: 2` | Confirmed, with two valid signatures. |
| `GET /api/v1/audit` | Everything you just did, including the request that was refused. |

---

## Running the tests

From the `backend` folder, with the virtual environment active:

```bash
python scripts/self_check.py     # plain-English proof, 33 checks
python -m pytest -q              # full suite, 113 tests
```

`self_check.py` is the one to run first. It exercises every requirement against
a temporary database, then **deliberately attacks it** — rewrites a witness
statement, swaps an evidence file, edits a ledger row, chops the end off the
chain, forges a signature, deletes an audit record — and confirms each attack is
caught. It prints one PASS/FAIL line per requirement and cleans up after itself.

```
  [PASS] the same officer CANNOT confirm their own item
  [PASS] capture far from the logged shift is FLAGGED
  [PASS] rewriting a witness statement in the database is CAUGHT
  ...
  33 passed, 0 failed
```

---

## Project layout

```
Chain-of-Truth/
├── backend/                  Part 1 — evidence integrity layer
│   ├── app/
│   │   ├── api/              HTTP routes
│   │   ├── core/             hashing, Ed25519 signatures, write lock
│   │   ├── services/         ledger, evidence, audit, device metadata, sync
│   │   ├── models.py         database schema
│   │   └── main.py           application entry point
│   ├── scripts/
│   │   ├── seed_demo.py      loads the demo case
│   │   └── self_check.py     one-command proof it works
│   ├── tests/                113 tests
│   ├── requirements.txt
│   └── README.md             full technical documentation
├── LICENSE
└── README.md
```

**[`backend/README.md`](backend/README.md)** has the depth: how the hash chain is
constructed, the full API reference, what each tamper attack is caught by, the
integration hooks for the other parts of the system, and the known limitations
stated plainly.

---

## Configuration

Everything defaults to a local SQLite database and a local storage folder, so
there is nothing to configure to run it. To override:

| Variable | Default | Purpose |
| --- | --- | --- |
| `COT_DATABASE_URL` | `sqlite:///backend/chain_of_truth.db` | Database connection |
| `COT_STORAGE_DIR` | `backend/storage/` | Where evidence files are written |
| `COT_SHIFT_TOLERANCE_M` | `2000` | Distance before a capture location is flagged |
| `COT_MAX_UPLOAD_BYTES` | `209715200` (200 MB) | Upload size limit |

---

## The wider system

Chain of Truth is designed in five parts. This repository holds the first; the
rest read from and write to the verified case timeline this layer maintains.

1. **Backend & tamper-proof ledger** — *this repo*
2. AI extraction & RAG pipeline — entity extraction, contradiction detection
3. Investigation guidance, autopsy cross-check and chargesheet QA agents
4. Frontend — case timeline, contradiction flags, confirm/dismiss UI
5. Security, integration and demo — role-based access control, encryption

The integration points are documented in
[`backend/README.md`](backend/README.md#integration-seams-for-the-other-parts).
In short: other parts read confirmed evidence via
`GET /api/v1/cases/{id}/evidence?status=CONFIRMED`, and write AI flags and the
officer's confirm/dismiss decisions back into the same tamper-evident chain via
`POST /api/v1/cases/{id}/ledger/append` — so what the AI said, and what the
officer did about it, is as tamper-evident as the evidence itself.

It is designed to sit **on top of** existing government systems such as CCTNS
and ICJS, which digitise and share records but do not reason over them. This is
an active analysis layer, not a replacement data backbone.

---

## Note on the demo build

Two simplifications are worth stating openly rather than hiding:

- **Officer signing keys are held server-side** so the demo can be seeded. A
  production deployment keeps the private key in the officer's device keystore
  or smart card and only ever sends the signature. The verification code is
  identical either way.
- **Identity is a request header**, replaced by real authentication and
  role-based access control in Part 5. It is isolated in a single file
  (`backend/app/api/deps.py`) precisely so it can be swapped out cleanly.

---

## License

[MIT](LICENSE)
>>>>>>> origin/main
