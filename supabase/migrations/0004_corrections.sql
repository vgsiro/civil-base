-- Phase 5b: Expert corrections on structural responses
CREATE TABLE IF NOT EXISTS structural_corrections (
  id               bigserial PRIMARY KEY,
  response_id      bigint REFERENCES structural_responses(id) ON DELETE SET NULL,
  rating           int CHECK (rating IN (-1, 0, 1)),
  corrected_answer text,
  note             text,
  reviewer         text,
  status           text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_structural_corrections_status ON structural_corrections (status);
CREATE INDEX IF NOT EXISTS idx_structural_corrections_response ON structural_corrections (response_id);
