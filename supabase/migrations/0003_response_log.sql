-- Phase 5a: Audit log for every structural AI response
CREATE TABLE IF NOT EXISTS structural_responses (
  id            bigserial PRIMARY KEY,
  question      text NOT NULL,
  scope         text DEFAULT 'structural',
  edition       text,
  retrieved_ids uuid[],
  ai_answer     text NOT NULL,
  calc_json     jsonb,
  verified      jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_structural_responses_created ON structural_responses (created_at DESC);
