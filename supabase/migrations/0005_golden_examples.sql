-- Phase 5c: Vetted Q&A pairs injected as few-shot examples
CREATE TABLE IF NOT EXISTS golden_examples (
  id                   bigserial PRIMARY KEY,
  question             text NOT NULL,
  answer               text NOT NULL,
  scope                text DEFAULT 'structural',
  edition              text,
  source_correction_id bigint REFERENCES structural_corrections(id) ON DELETE SET NULL,
  active               boolean DEFAULT true,
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_golden_examples_scope_active ON golden_examples (scope, active);

-- Phase 5d: Evaluation cases for measuring improvement over time
CREATE TABLE IF NOT EXISTS eval_cases (
  id       bigserial PRIMARY KEY,
  question text NOT NULL,
  expected jsonb,
  scope    text DEFAULT 'structural',
  created_at timestamptz DEFAULT now()
);
