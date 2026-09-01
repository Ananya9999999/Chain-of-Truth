# Chain of Truth — Security Model (Part 5)

## Role-based access control

| Role | Typical permissions |
|------|---------------------|
| INVESTIGATING_OFFICER | Upload evidence, view case, resolve contradictions, ack guidance |
| SUPERVISOR | All officer actions + case manage + audit view + chargesheet QA |
| FORENSIC_REVIEWER | View evidence/timeline, autopsy analysis + sign-off |
| LEGAL_REVIEWER | View case, guidance, chargesheet QA + sign-off, audit view |

Enforcement: `app/api/deps_rbac.py` (`require_roles`, `require_permission`).  
Identity still enters through Part 1’s `deps.get_current_user` (header → User). Swap to JWT later without touching routes.

## Audit trail

- Every view and every write is audited (Part 1 already hash-chains the audit log).
- Part 3 agent calls also audit: `VIEW_GUIDANCE`, `VIEW_AUTOPSY_ANALYSIS`, `RUN_CHARGESHEET_QA`, `RUN_FULL_ANALYSIS`.

## Encryption (pitch + roadmap)

| Layer | Hackathon | Production |
|-------|-----------|------------|
| In transit | HTTPS (or demo HTTP on localhost) | TLS 1.2+ everywhere |
| At rest | SQLite file permissions / encrypted volume note | DB encryption (SQLCipher or cloud KMS) |
| Evidence files | Content hashed; store access controlled | Encrypted object storage |
| Keys | Demo keys on server (documented) | Device-held keys; HSM for signing |

## Data minimization

- Victim/witness PII restricted to roles that need it (`FORENSIC_REVIEWER`, `LEGAL_REVIEWER`, case officers).
- AI layer works on case text needed for analysis; does not broaden access.

## AI trust boundary

- AI never files, never auto-confirms, never becomes ground truth.
- Verified case record ≠ AI working analysis layer.
- Courts see verified record + transparent AI-flag / officer-response log.

## Integration with government systems

- Designed to **complement** CCTNS / ICJS, not replace them.
- Ingest or receive evidence destined for systems of record; return due-diligence logs.
