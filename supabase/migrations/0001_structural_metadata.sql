-- Phase 2a: Add structural metadata columns to pdf_chunks
ALTER TABLE pdf_chunks
  ADD COLUMN IF NOT EXISTS category    text,
  ADD COLUMN IF NOT EXISTS code_family text,   -- 'eurocode' | 'tcvn'
  ADD COLUMN IF NOT EXISTS code_ref    text,   -- 'EN 1993-1-1'
  ADD COLUMN IF NOT EXISTS edition     text,   -- '2005+A1:2014'
  ADD COLUMN IF NOT EXISTS clause_ref  text,   -- '§6.2.5'
  ADD COLUMN IF NOT EXISTS table_ref   text,   -- 'Table 5.2'
  ADD COLUMN IF NOT EXISTS topic       text;   -- 'bending' | 'shear' | 'axial' | ...

CREATE INDEX IF NOT EXISTS idx_pdf_chunks_category ON pdf_chunks (category);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_code     ON pdf_chunks (code_ref, edition);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_clause   ON pdf_chunks (clause_ref);
