-- Enable RLS on all tables
ALTER TABLE matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_messages  ENABLE ROW LEVEL SECURITY;

-- matches: public read, service-role write
CREATE POLICY "matches_public_read"
  ON matches FOR SELECT
  USING (true);

-- match_players: public read, service-role write
CREATE POLICY "match_players_public_read"
  ON match_players FOR SELECT
  USING (true);

-- raw_messages: service-role only (no public access)
-- (no SELECT policy = anon/authenticated roles cannot read)

-- Note: INSERT / UPDATE / DELETE on all tables are implicitly
-- denied for anon/authenticated roles. Only the service-role
-- key (used server-side and in the listener) bypasses RLS.
