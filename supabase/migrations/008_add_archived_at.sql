ALTER TABLE matches ADD COLUMN archived_at timestamptz;
CREATE INDEX idx_matches_archived_at ON matches (archived_at);
