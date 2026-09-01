<<<<<<< HEAD
# Integrating Part 3 + Part 5 into Chain of Truth (Part 1 backend)

## Files in this package

```
backend/app/services/ai_engine.py   ← Part 3 agents + legal KB
backend/app/api/routes_agents.py    ← Part 3 API routes
backend/app/api/deps_rbac.py        ← Part 5 role enforcement
docs/DEMO_SCRIPT.md                 ← Live demo script + judge Q&A
docs/SECURITY.md                    ← Security model for the pitch
frontend/index.html                 ← Optional demo UI (Part 4/5)
```

## 1. Copy files

From this package into your Part 1 repo:

```bash
cp backend/app/services/ai_engine.py   <repo>/backend/app/services/
cp backend/app/api/routes_agents.py    <repo>/backend/app/api/
cp backend/app/api/deps_rbac.py        <repo>/backend/app/api/
```

## 2. Mount the router in `app/main.py`

```python
from .api import routes_agents  # add import

# inside app setup, with the other include_router calls:
app.include_router(routes_agents.router, prefix="/api")

# optional transparency endpoint
from .api.routes_agents import legal_kb_payload
@app.get("/api/legal-kb")
def legal_kb():
    return legal_kb_payload()
```

## 3. Audit service compatibility

`routes_agents.py` calls:

```python
audit.record(db, actor=user, action="...", resource_type="...", resource_id=..., details={...}, ip_address=..., user_agent=...)
```

If your `services/audit.py` uses different parameter names, adjust the calls once (single file).

## 4. Evidence field mapping

`_evidence_dicts()` already tries common field names from Part 1 (`raw_content`, `text_content`, `content_hash`, `chain_hash`, `status`, etc.). If your model uses different names, edit that helper only.

## 5. Part 5 RBAC usage example

```python
from .api.deps_rbac import require_roles, require_permission
=======
# Integration status

Part 3 agents and Part 5 RBAC are **already integrated** in this repository.

## Mounted in `backend/app/main.py`

- `routes_agents.router` under `/api/v1`
- `GET /api/v1/legal-kb` for KB transparency

## Files

| File | Role |
| --- | --- |
| `backend/app/services/ai_engine.py` | Guidance, autopsy, chargesheet QA, legal KB |
| `backend/app/api/routes_agents.py` | HTTP surface for agents (audited) |
| `backend/app/api/deps_rbac.py` | `require_roles` / `require_permission` |

## Using RBAC on a route

```python
from .deps_rbac import require_permission
>>>>>>> origin/main

@router.post("/{case_id}/chargesheet-qa")
def chargesheet_qa(
    ...,
    user: User = Depends(require_permission("chargesheet:qa")),
):
    ...
```

<<<<<<< HEAD
## 6. Principle (never relax)

- AI never writes into the verified case record.
- Every agent response carries an explicit label: hypothesis / unverified / requires human review.
- Courts only see verified evidence + the transparent log of AI flags and officer responses.
=======
## Evidence field mapping

`routes_agents._evidence_dicts` maps Part 1 `Evidence` fields (`text_content`, `content_hash`, `collected_at`, `status == CONFIRMED`, etc.). Adjust that helper only if the schema changes.

## Principle

AI routes **only read** evidence and return labeled hypotheses. They do not write verified case conclusions.
>>>>>>> origin/main
