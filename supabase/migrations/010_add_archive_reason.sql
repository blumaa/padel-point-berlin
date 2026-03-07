ALTER TABLE matches ADD COLUMN archive_reason text
  CHECK (archive_reason IN ('filled', 'canceled', 'empty', 'expired', 'stale'));
