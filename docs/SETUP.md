# Chain of Truth — Local Setup

Windows / PowerShell instructions. Run every command from the repository root
(`C:\Users\lisam\Projects\Chain_of_truth`) unless stated otherwise.

---

## 1. Required software

| Software | Version | Verify | Where it goes |
| --- | --- | --- | --- |
| Docker Desktop | 24+ | `docker --version` | System install, must be **running** |
| Python | 3.12.x recommended | `python --version` | System install |
| Node.js | 20.11+ or 22 LTS | `node --version` | System install |
| npm | 10+ (ships with Node) | `npm --version` | bundled with Node.js |
| Git | 2.40+ | `git --version` | System install |

Verify everything at once:

```powershell
docker --version; docker compose version; python --version; node --version; npm --version; git --version
```

Docker Desktop must show **Engine running** before you continue:

```powershell
docker info --format '{{.ServerVersion}}'
```

---

## 2. Environment variables

The real `.env` lives in the **repository root** and is gitignored.

```powershell
Copy-Item .env.example .env
```

Then generate real secrets and paste them into `.env`:

```powershell
# JWT signing secret
python -c "import secrets; print(secrets.token_urlsafe(64))"

# PII encryption key (base64, 32 bytes)
python -c "import base64,os; print(base64.b64encode(os.urandom(32)).decode())"
```

Frontend-visible values go in `frontend/.env.local` (only `NEXT_PUBLIC_*` reaches
the browser — never put a secret there):

```powershell
Copy-Item frontend\.env.local.example frontend\.env.local
```

---

## 3. Database + object storage (Docker)

This is the whole database setup. `pgvector/pgvector:pg16` ships PostgreSQL 16
with **pgvector already compiled in**, so there is no extension to build by hand.
`docker/postgres/init/01-extensions.sql` runs automatically on first boot and
enables `vector`, `pg_trgm` and `pgcrypto`.

### Start

```powershell
.\scripts\dev-up.ps1
```

Or without the helper script:

```powershell
docker compose -f docker/docker-compose.yml --env-file .env up -d
```

### Verify

```powershell
.\scripts\db-verify.ps1
```

Expected: `cot-postgres` and `cot-minio` **Up (healthy)**, and `cot-minio-init`
**Exited (0)** — that one is a one-shot bucket creator, so exiting is success.

Check manually:

```powershell
docker compose -f docker/docker-compose.yml --env-file .env ps -a
docker exec cot-postgres pg_isready -U cot -d chain_of_truth
docker exec cot-postgres psql -U cot -d chain_of_truth -c "SELECT extname, extversion FROM pg_extension ORDER BY extname;"
```

You should see:

```
 extname  | extversion
----------+------------
 pg_trgm  | 1.6
 pgcrypto | 1.3
 plpgsql  | 1.0
 vector   | 0.8.6
```

pgvector smoke test (must print `1`):

```powershell
docker exec cot-postgres psql -U cot -d chain_of_truth -tAc "SELECT '[1,2,3]'::vector <-> '[1,2,4]'::vector;"
```

### Services

| Service | URL / DSN | Credentials |
| --- | --- | --- |
| PostgreSQL | `localhost:5432` db `chain_of_truth` | `cot` / `cot_dev_password` |
| MinIO API | http://localhost:9000 | `cot_minio_admin` / `cot_minio_dev_password` |
| MinIO console | http://localhost:9001 | same |

Bucket `evidence` is created automatically with **versioning enabled**.

### Stop / reset

```powershell
.\scripts\dev-down.ps1            # stop, keep data
.\scripts\dev-down.ps1 -Purge     # stop AND delete all local data
```

### Connect with a SQL client

```powershell
docker exec -it cot-postgres psql -U cot -d chain_of_truth
```

### AI provider (Groq)

The repo is configured for Groq. Put your key in the root `.env`:

```dotenv
COT_AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
COT_GROQ_MODEL=llama-3.3-70b-versatile
```

Verify it before relying on it:

```powershell
cd backend
python scripts\check_ai.py --models
python scripts\check_ai.py --live
cd ..
```

A healthy result ends with `RESULT: OK`. If it says `FELL BACK`, the key or model is
wrong and the deterministic provider would run instead — the UI would show `AI: MOCK`.

To run entirely offline (no key, no network), set `COT_AI_PROVIDER=mock`.

---

## 4. Backend

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
```

Run the test suite (should be **113 passed**):

```powershell
cd backend
python -m pytest tests -q
cd ..
```

Start the API:

```powershell
uvicorn backend.app.main:app --reload --port 8000
```

Verify:

```powershell
Invoke-RestMethod http://localhost:8000/health
Start-Process http://localhost:8000/docs
```

> **Phase 0 note:** the backend still uses SQLite. The migration to PostgreSQL +
> pgvector (Alembic migrations, `COT_DATABASE_URL`) lands in Phase 1 — the
> infrastructure above is provisioned and verified ahead of it.

---

## 5. Frontend

From the **repository root** (not from inside `frontend/`):

```powershell
cd frontend
npm install
npm run dev
```

Or, from anywhere:

```powershell
.\scripts\run-frontend.ps1
```

Verify: http://localhost:3000

| Route | Purpose | Auth |
| --- | --- | --- |
| `/` | Public landing page | no |
| `/login` | Officer sign-in (demo roles) | no |
| `/dashboard` | Investigation workspace | yes — redirects to `/login` |

Quality gates:

```powershell
npm run typecheck   # tsc --noEmit
npm run build       # production build, fails on type errors
```

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `docker compose` fails instantly | Docker Desktop not running | Start Docker Desktop, wait for "Engine running" |
| Port 5432 already in use | Local PostgreSQL installed | Set `POSTGRES_PORT=5433` in `.env`, restart stack |
| `extension "vector" does not exist` | Volume created before init script | `.\scripts\dev-down.ps1 -Purge` then `.\scripts\dev-up.ps1` |
| `cot-minio-init` shows Exited | **This is correct** | One-shot job; exit code 0 = success |
| `npm install` fails mid-download | Flaky network dropping packages | Retries are preconfigured in `frontend/.npmrc`; re-run `npm install` |
| `cannot find path ...\frontend\frontend` | You were already inside `frontend/` | Use `.\scripts\run-frontend.ps1` - it works from any directory |
| `Another next dev server is already running` | A dev server from an earlier session still holds port 3000 | `.\scripts\run-frontend.ps1` stops it first, or `taskkill /PID <pid> /F` |
| UI looks stale after editing `next.config.mjs` | That file is read once at startup and is **not** hot-reloaded | Restart the dev server |
| API returns stale data | An old `uvicorn` still holds port 8000, possibly on the SQLite fallback | `.\scripts\run-backend.ps1` stops it first |
