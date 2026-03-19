-- Analytics query performance indexes
CREATE INDEX IF NOT EXISTS idx_matches_analytics
  ON matches (match_time DESC)
  INCLUDE (venue, archive_reason, indoor, competition_mode, category, level_min, created_at);

CREATE INDEX IF NOT EXISTS idx_match_players_status
  ON match_players (match_id, status);
