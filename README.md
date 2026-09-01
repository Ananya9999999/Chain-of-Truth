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
