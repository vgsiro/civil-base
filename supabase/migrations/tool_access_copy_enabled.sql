ALTER TABLE tool_access
  DROP COLUMN IF EXISTS copy_enabled,
  ADD COLUMN IF NOT EXISTS copy_tier text NOT NULL DEFAULT 'admin';
