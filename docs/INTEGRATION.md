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

@router.post("/{case_id}/chargesheet-qa")
def chargesheet_qa(
    ...,
    user: User = Depends(require_permission("chargesheet:qa")),
):
    ...
```

## Evidence field mapping

`routes_agents._evidence_dicts` maps Part 1 `Evidence` fields (`text_content`, `content_hash`, `collected_at`, `status == CONFIRMED`, etc.). Adjust that helper only if the schema changes.

## Principle

AI routes **only read** evidence and return labeled hypotheses. They do not write verified case conclusions.
