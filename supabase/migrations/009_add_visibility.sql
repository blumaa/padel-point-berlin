ALTER TABLE matches ADD COLUMN visibility text DEFAULT 'VISIBLE';
CREATE INDEX idx_matches_visibility ON matches (visibility);
