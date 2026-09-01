# Chain of Truth — Part 1: Backend & Tamper-Proof Ledger

The evidence integrity layer the rest of the system sits on. **No AI in here by
design** — hashing is cryptography, and it needs to be deterministic and provably
reliable rather than probabilistic. That is a deliberate credibility choice, and
it is worth saying out loud to judges.

## What this part delivers

| Spec requirement | Where it lives | Status |
| --- | --- | --- |
| Evidence upload API (file + text) | `app/api/routes_evidence.py` | working |
| SHA-256 hash chain per case | `app/services/ledger.py` | working |
| Two-person confirmation flow | `app/services/evidence.py` | working, Ed25519-enforced |
| Locked device metadata + shift cross-check | `app/services/device_metadata.py` | working |
| Audit trail on every view/access | `app/services/audit.py` | working, itself hash-chained |
| Offline-first sync | `app/services/sync.py` | working, idempotent |

113 tests, including tests that actually tamper with the database and assert the
system catches it, an adversarial pass (hostile input, path traversal, injection,
unicode, oversized uploads), concurrency tests, and multi-case isolation tests.

## How to test this (start here)

Setup is in the [main README](../README.md#quick-start). With the virtual
environment active and your terminal in this `backend` folder:

**1. The plain-English proof — run this first.**

```bash
python scripts/self_check.py
```

Exercises every Part 1 requirement against a throwaway database, then actively
breaks things — rewrites a witness statement, swaps a file, edits a ledger row,
chops the chain's tail off, forges a signature, deletes an audit record — and
proves each one is caught. Prints one PASS/FAIL line per requirement and ends
with `33 passed, 0 failed`. It touches nothing you already have.

**2. The full test suite.**

```bash
python -m pytest -q
```

Expect `113 passed`. Add `-v` to see every test name.

**3. Click around it yourself.**

```bash
python scripts/seed_demo.py --reset
python -m uvicorn app.main:app --reload --port 8000
```

Then open <http://127.0.0.1:8000/docs> — an interactive page listing every
endpoint, with a "Try it out" button on each. Put `1` in the `X-Officer-Id`
header box (that is Insp. Anita Rao; `2` is SI Bhaskar Nair). Good ones to try:

- `GET /api/v1/cases/1/ledger` — the hash chain, each `prev_hash` matching the
  previous `entry_hash`.
- `GET /api/v1/cases/1/ledger/verify` — should say `"valid": true`.
- `GET /api/v1/cases/1/evidence/pending` — the one item awaiting a second officer.
- `POST /api/v1/evidence/{uid}/confirm` with `X-Officer-Id: 2` — confirm it.
  Try `X-Officer-Id: 1` first and watch it refuse with 409.

If you have not activated the virtual environment, prefix each command with the
path to its interpreter instead — on Windows
`..\.venv\Scripts\python.exe scripts\self_check.py`, elsewhere
`../.venv/bin/python scripts/self_check.py`.

Config is environment-driven: `COT_DATABASE_URL`, `COT_STORAGE_DIR`,
`COT_SHIFT_TOLERANCE_M`, `COT_MAX_UPLOAD_BYTES`. Defaults are SQLite +
`backend/storage/`, so there is nothing to set up for the demo.

## Known limits, stated plainly

- **Concurrency.** All database writes are serialised through one in-process
  lock (`app/core/locks.py`), because SQLite allows a single writer and the
  chain needs atomic sequence allocation. Verified at 30 parallel uploads over
  real HTTP: contiguous chain, no duplicates, still verifiable. This holds for
  **one uvicorn worker**, which is the demo deployment. Multiple workers or
  processes would need Postgres with `SELECT … FOR UPDATE`; the `UNIQUE`
  constraints on `(case_id, seq)` and audit `seq` are the correctness backstop
  either way.
- **Audit-chain tail truncation** — see cross-anchoring above; mitigated by
  `GET /audit/anchor`.
- **Demo key custody** — private keys are server-side; see the note under
  two-person confirmation.
- Column length limits (`String(512)` etc.) are not enforced by SQLite. They
  would be enforced on Postgres.

## Identity (temporary — Part 5 replaces this)

Every request identifies the acting officer with a header:

```
X-Officer-Id: 1          # or  X-Badge-Number: KA-1001
```

`app/api/deps.py` is the **single place identity enters the system**. Swapping
the header for a real signed token and adding permission tiers is a change to
that one file — every route already receives a `User`, and every access is
already logged with that user's id and role.

## How the hash chain works

Each case owns one append-only chain:

```
seq 0  CASE_OPENED         prev_hash = 000…0   (genesis)
seq 1  EVIDENCE_UPLOADED   prev_hash = entry_hash(seq 0)
seq 2  EVIDENCE_CONFIRMED  prev_hash = entry_hash(seq 1)
```

```
entry_hash = SHA256(canonical_json({
    algorithm, version, seq, case_number, event_type,
    actor_id, created_at, payload_hash, prev_hash
}))
```

Everything is hashed over a *canonical* JSON encoding (sorted keys, fixed
separators, UTF-8) so a digest is reproducible byte-for-byte anywhere.
`GET /cases/{id}/ledger/verify` recomputes the whole chain from genesis — it does
not read a "verified" flag anywhere — and reports the exact seq where it breaks.

**What it detects**

| Attack | Detected by |
| --- | --- |
| Edit a past ledger entry | `PAYLOAD_ALTERED` / `ENTRY_HASH_MISMATCH` |
| Delete an entry from the middle | `SEQUENCE_GAP` / `BROKEN_LINK` |
| Chop entries off the end | `CHAIN_TRUNCATED` (see cross-anchoring below) |
| Swap the file behind a record | `FILE_ALTERED` (files are re-hashed on verify) |
| Rewrite a witness statement's text | `TEXT_ALTERED` (text is re-hashed too) |
| Delete an evidence file from disk | `FILE_MISSING` |
| Forge an officer's confirmation | Ed25519 signature fails to verify |
| Delete or edit an access-log row | `SEQUENCE_GAP` / `ENTRY_HASH_MISMATCH` on `/audit/verify` |

**Cross-anchoring.** A hash chain cannot detect its own tail being chopped off.
So every ledger append also writes its new head into the *audit* chain. Truncate
the ledger and the audit log still remembers a higher sequence number →
`CHAIN_TRUNCATED`.

**The one honest gap, and its fix.** That leaves the audit chain's own tail.
Nothing inside a database can prove its last rows were never removed — only
something outside it can. `GET /api/v1/audit/anchor` exports the current head
hash so it can be recorded somewhere else (a second system, a daily register, a
public timestamping service). Say this proactively if a judge probes: it is a
known property of hash chains, not an oversight, and the mitigation is one
integration away.

## Two-person confirmation

```
collecting officer uploads   →  PENDING_CONFIRMATION, signature 1 of 2
witnessing officer confirms  →  CONFIRMED,            signature 2 of 2
                                both signatures hashed into the chain
```

Each officer signs an **Ed25519 attestation** over the evidence's content hash,
with their own id and role bound into the signed payload — so a collecting
signature cannot be replayed as the witnessing one. The rule is enforced
cryptographically, not by a boolean column somebody with DB access could flip.

- The collecting officer **cannot** confirm their own item (`409 SAME_OFFICER`).
- Two-person is the default for everything and **mandatory, non-waivable** for
  physical evidence (`WEAPON`, `SEIZED_ITEM`, `PHYSICAL_SAMPLE`,
  `BIOLOGICAL_SAMPLE`, `PHYSICAL_DOCUMENT`, `AUTOPSY_REPORT`,
  `FORENSIC_REPORT`) — passing `requires_two_person=false` on those is refused.
- A rejection is **recorded, never deleted** — the item stays in the record with
  its reason and a `EVIDENCE_REJECTED` chain entry.

> **Demo simplification, state it openly:** officers' private keys are generated
> and held server-side. Production keeps the private key in the officer's device
> keystore or smart card and only sends the signature. Verification code is
> identical either way.

## Locked device metadata

`PHOTO`, `VIDEO`, `CCTV_FOOTAGE` and `AUDIO_RECORDING` **cannot be uploaded
without device metadata** (`422 DEVICE_METADATA_REQUIRED`). What is supplied is
frozen at upload — there is no route anywhere in the API that can edit it — and
its hash goes into the chain, so a later edit breaks verification.

Three independent checks run at upload:

1. `CAPTURE_BEFORE_UPLOAD` — a capture cannot postdate its own upload.
2. `CAPTURE_GPS_PRESENT` — coordinates supplied at all.
3. `SHIFT_LOCATION_MATCH` — capture GPS vs the officer's logged shift location
   (haversine, tolerance from the shift radius or `COT_SHIFT_TOLERANCE_M`).

Result is `CONSISTENT`, `FLAGGED`, or `INSUFFICIENT_DATA`. No roster on file
reports **"we cannot tell"**, never "this is fine" — the honest answer is part of
the point.

This does not make fraud impossible. It raises the bar from *one person can fake
this alone* to *several independent signals would have to be falsified together*
— which is the realistic claim to make to a judge.

## Offline-first sync

`POST /api/v1/sync/batch` ingests evidence logged on a device with no
connectivity.

- **Idempotent** per `client_uuid` — a retry after a dropped connection returns
  the existing record instead of duplicating it or re-chaining.
- The device's own `content_hash_client` is **re-verified against the bytes
  received**; a mismatch is rejected before anything is written
  (`CONTENT_HASH_MISMATCH`).
- Original `collected_at` / `recorded_at_device` are preserved; the server adds
  `synced_at`.
- Optional **device seal**: if the field device signs
  `{client_uuid, content_hash, recorded_at_device}` with the officer's key, the
  original timestamp is cryptographically sealed. Without it the response says
  so explicitly — "asserted by the device but not cryptographically proven"
  rather than implying proof it doesn't have.
- One bad record does not fail the batch; each gets its own result.

**Honest limitation, stated in the code:** chain *position* is necessarily sync
time — you cannot insert into a hash chain retroactively without breaking it. So
the ledger shows "this arrived late, and here is the device's sealed claim about
when it was really collected." Ordering by event time is the timeline's job
(Parts 2/4); ordering by chain position is the ledger's.

## API reference

All routes are under `/api/v1` and require the officer header. Full interactive
docs at `/docs`.

**Officers & shifts**
```
POST   /officers                       register + issue keypair
GET    /officers
POST   /officers/{id}/shifts           roster entry for metadata cross-check
GET    /officers/{id}/shifts
```

**Cases**
```
POST   /cases                          → writes the genesis chain entry
GET    /cases
GET    /cases/{case_ref}               id or case number; includes chain head
```

**Evidence**
```
POST   /cases/{case_ref}/evidence          multipart: file + fields
POST   /cases/{case_ref}/evidence/text     JSON: text-only evidence
GET    /cases/{case_ref}/evidence          ?status=CONFIRMED&evidence_type=…
GET    /cases/{case_ref}/evidence/pending  the confirmation queue
GET    /evidence/{uid}                     full detail + signatures + integrity
GET    /evidence/{uid}/file                audited AND written to the chain
POST   /evidence/{uid}/confirm             second officer
POST   /evidence/{uid}/reject              second officer declines
```

**Ledger**
```
GET    /cases/{case_ref}/ledger          ?since_seq=N for live polling
GET    /cases/{case_ref}/ledger/verify   recomputes everything
POST   /cases/{case_ref}/ledger/append   ← the hook for Parts 2–4
```

**Audit**
```
GET    /audit          ?case_id=&actor_id=&action=&resource_type=&limit=
GET    /audit/verify
GET    /audit/anchor   export head hash for external anchoring
```

**Offline sync**
```
POST   /sync/batch
GET    /sync/status
```

## Integration seams for the other parts

### Part 2 — AI extraction & RAG

Read the verified case record:

```http
GET /api/v1/cases/1/evidence?status=CONFIRMED
```

`text_content` is inline for statements and reports, so no file download is
needed. `occurred_at` (when the event happened) is separate from `uploaded_at`
(when it reached the server) — build the timeline on `occurred_at`.

Write flags and extractions back into the tamper-evident record:

```http
POST /api/v1/cases/1/ledger/append
X-Officer-Id: 1

{
  "event_type": "AI_FLAG_RAISED",
  "evidence_id": 3,
  "payload": {
    "flag_type": "TIME_CONTRADICTION",
    "severity": "MAJOR",
    "confidence": 0.82,
    "explanation": "statement says 9 PM; CAM-07 shows exit at 21:47:32",
    "sources": ["<evidence-uid-a>", "<evidence-uid-b>"]
  }
}
```

Allowed `event_type` values: `AI_EXTRACTION_RECORDED`, `AI_FLAG_RAISED`,
`AI_FLAG_CONFIRMED`, `AI_FLAG_DISMISSED`, `TIMELINE_ENTRY_VERIFIED`,
`GUIDANCE_ISSUED`, `AUTOPSY_HYPOTHESIS_LOGGED`, `CHARGESHEET_QA_RUN`,
`CASE_NOTE`. Evidence lifecycle events are **refused** through this hook so
nobody can forge an `EVIDENCE_CONFIRMED` entry — those come only from the
evidence endpoints.

This is what makes "what the AI said, and what the officer did about it" as
tamper-evident as the evidence itself — the audit trail of diligence the pitch
promises.

### Part 3 — Guidance / autopsy / chargesheet agents

Same append hook (`GUIDANCE_ISSUED`, `AUTOPSY_HYPOTHESIS_LOGGED`,
`CHARGESHEET_QA_RUN`). Post-mortem reports upload as
`evidence_type=AUTOPSY_REPORT`, which is in the mandatory two-person set.

### Part 4 — Frontend

- `GET /cases/{id}/ledger?since_seq=N` — poll for new links, animate the chain
  growing during the live upload.
- `GET /cases/{id}/evidence/pending` — the confirm/dismiss queue.
- `POST /evidence/{uid}/confirm` — the confirm button.
- Evidence detail carries `signatures[].valid`, `two_person_complete`,
  `device_metadata.cross_check_result` + per-check explanations, and
  `integrity.file_intact` — enough to render "verified / unverified" honestly
  without inventing state.
- `GET /cases/{id}/ledger/verify` — the green "chain intact" badge.
- CORS is open, so a dev frontend on another port works out of the box.

### Part 5 — Security & integration

- `app/api/deps.py` is the only identity entry point; roles are already stored
  on `User` and stamped on every audit row (`actor_role`), so permission tiers
  layer on without a schema change.
- Every read and write, including denied and not-found attempts, is already
  audited with actor, role, IP and user-agent.
- Encryption in transit is a TLS terminator in front of this service; encryption
  at rest applies to `COT_STORAGE_DIR` and the database file — neither changes
  application code.
- `GET /audit/anchor` is the external-anchoring hook described above.

## Design decisions worth defending on stage

- **No AI in the integrity layer.** Tamper-proofing is cryptographic hashing,
  full stop. Being explicit about where AI is *not* used builds credibility.
- **Signatures, not flags.** Two-person confirmation is enforced by Ed25519
  verification, so it survives someone with database write access.
- **Nothing is ever deleted.** Rejections, denied access attempts and failed
  lookups are all recorded. The system's answer to bad data is "record it", not
  "remove it".
- **Reads are logged.** Auditing only edits would miss the insider who browses a
  case file they have no business in.
- **Limitations are stated in the code, not hidden.** Tail truncation, offline
  chain position, and server-held demo keys are each documented at the point
  where they apply, with the production fix named.
