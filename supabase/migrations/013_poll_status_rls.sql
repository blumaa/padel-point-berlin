-- Enable RLS on poll_status (accessed only via service-role)
ALTER TABLE poll_status ENABLE ROW LEVEL SECURITY;

-- No public SELECT/INSERT/UPDATE/DELETE policies needed.
-- All access goes through the service-role key which bypasses RLS.
