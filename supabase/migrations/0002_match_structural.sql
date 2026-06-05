-- Phase 2b: Scoped + hybrid retrieval for structural documents
-- Enables pgvector if not already present, then creates a keyword-only
-- retrieval function. Vector scoring is added separately (see comment below)
-- once embeddings are confirmed in the table.

CREATE EXTENSION IF NOT EXISTS vector;

-- Keyword-only version (safe to run immediately, no vector column required).
-- When you have embeddings loaded and want hybrid scoring, replace this with
-- the vector-aware version in the comment block at the bottom of this file.
CREATE OR REPLACE FUNCTION match_structural_chunks(
  query_text      text,
  match_count     int  DEFAULT 8,
  filter_edition  text DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  content     text,
  code_ref    text,
  clause_ref  text,
  edition     text,
  page_number int,
  score       float
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.id,
    c.content,
    c.code_ref,
    c.clause_ref,
    c.edition,
    c.page_number,
    ts_rank(
      to_tsvector('simple', c.content),
      plainto_tsquery('simple', query_text)
    )::float AS score
  FROM pdf_chunks c
  WHERE c.category = 'structural'
    AND (filter_edition IS NULL OR c.edition = filter_edition)
  ORDER BY score DESC
  LIMIT match_count;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- HYBRID VERSION (vector + keyword) — run this AFTER ingest.js has populated
-- the embedding column on pdf_chunks.  Replace the function above with:
--
-- CREATE OR REPLACE FUNCTION match_structural_chunks(
--   query_text      text,
--   match_count     int           DEFAULT 8,
--   filter_edition  text          DEFAULT NULL,
--   query_embedding vector(768)   DEFAULT NULL
-- )
-- RETURNS TABLE (id uuid, content text, code_ref text, clause_ref text,
--                edition text, page_number int, score float)
-- LANGUAGE sql STABLE AS $$
--   SELECT
--     c.id, c.content, c.code_ref, c.clause_ref, c.edition, c.page_number,
--     CASE
--       WHEN query_embedding IS NOT NULL
--       THEN (  0.7 * (1 - (c.embedding <=> query_embedding))
--             + 0.3 * ts_rank(to_tsvector('simple', c.content),
--                             plainto_tsquery('simple', query_text)))
--       ELSE ts_rank(to_tsvector('simple', c.content),
--                    plainto_tsquery('simple', query_text))
--     END::float AS score
--   FROM pdf_chunks c
--   WHERE c.category = 'structural'
--     AND (filter_edition IS NULL OR c.edition = filter_edition)
--   ORDER BY score DESC
--   LIMIT match_count;
-- $$;
-- ─────────────────────────────────────────────────────────────────────────────
