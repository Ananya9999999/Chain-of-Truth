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

@router.post("/{case_id}/chargesheet-qa")
def chargesheet_qa(
    ...,
    user: User = Depends(require_permission("chargesheet:qa")),
):
    ...
```

## 6. Principle (never relax)

- AI never writes into the verified case record.
- Every agent response carries an explicit label: hypothesis / unverified / requires human review.
- Courts only see verified evidence + the transparent log of AI flags and officer responses.
