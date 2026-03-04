-- Indexes for commonly filtered columns on matches
CREATE INDEX IF NOT EXISTS idx_matches_venue
  ON matches (venue);

CREATE INDEX IF NOT EXISTS idx_matches_level_min
  ON matches (level_min);

CREATE INDEX IF NOT EXISTS idx_matches_level_max
  ON matches (level_max);

CREATE INDEX IF NOT EXISTS idx_matches_category
  ON matches (category);

CREATE INDEX IF NOT EXISTS idx_matches_indoor
  ON matches (indoor);

CREATE INDEX IF NOT EXISTS idx_matches_competition_mode
  ON matches (competition_mode);

CREATE INDEX IF NOT EXISTS idx_matches_created_at
  ON matches (created_at);
