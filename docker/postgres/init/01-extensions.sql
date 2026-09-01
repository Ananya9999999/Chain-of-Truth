-- Runs automatically on first boot of an empty data directory.
--
-- vector   : pgvector — embedding storage + similarity search for the RAG layer
-- pg_trgm  : trigram matching — powers Case Similarity Search over text
-- pgcrypto : gen_random_uuid() and digest() helpers
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  RAISE NOTICE 'Chain of Truth: extensions ready -> vector, pg_trgm, pgcrypto';
END
$$;
