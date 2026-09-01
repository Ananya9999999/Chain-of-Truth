# Docker infrastructure

| Service | Image | Purpose |
| --- | --- | --- |
| `cot-postgres` | `pgvector/pgvector:pg16` | PostgreSQL 16 with pgvector compiled in — relational + vector + graph storage |
| `cot-minio` | `minio/minio` | S3-compatible object storage for evidence files |
| `cot-minio-init` | `minio/mc` | One-shot: creates the `evidence` bucket with versioning, then exits |

`cot-minio-init` showing **Exited (0)** is success, not a failure.

## Commands

```powershell
docker compose -f docker/docker-compose.yml --env-file .env up -d      # start
docker compose -f docker/docker-compose.yml --env-file .env ps -a      # status
docker compose -f docker/docker-compose.yml --env-file .env logs -f    # logs
docker compose -f docker/docker-compose.yml --env-file .env down       # stop
docker compose -f docker/docker-compose.yml --env-file .env down -v    # stop + delete data
```

## Extensions

`postgres/init/01-extensions.sql` runs once, on an empty data directory:

- **vector** — pgvector, embedding storage and similarity search for RAG
- **pg_trgm** — trigram matching for Case Similarity Search
- **pgcrypto** — `gen_random_uuid()` / `digest()` helpers

Changing that file has no effect on an existing volume. To re-run it:
`down -v` then `up -d`.

## Volumes

`cot_pgdata` (database) and `cot_miniodata` (evidence files) are named volumes
and survive `down`. Only `down -v` deletes them.
