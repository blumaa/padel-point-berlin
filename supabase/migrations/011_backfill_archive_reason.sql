-- Backfill archive_reason for already-archived matches.
-- Priority: filled > expired > empty (best-effort heuristic).

-- 1. Filled: 4 confirmed match_players
UPDATE matches m
SET archive_reason = 'filled'
WHERE m.archived_at IS NOT NULL
  AND m.archive_reason IS NULL
  AND (
    SELECT count(*) FROM match_players mp
    WHERE mp.match_id = m.id AND mp.status = 'confirmed'
  ) >= 4;

-- 2. Expired: match_time already passed before archiving
UPDATE matches
SET archive_reason = 'expired'
WHERE archived_at IS NOT NULL
  AND archive_reason IS NULL
  AND match_time < archived_at;

-- 3. Empty: 0 confirmed players
UPDATE matches m
SET archive_reason = 'empty'
WHERE m.archived_at IS NOT NULL
  AND m.archive_reason IS NULL
  AND (
    SELECT count(*) FROM match_players mp
    WHERE mp.match_id = m.id AND mp.status = 'confirmed'
  ) = 0;

-- 4. Everything else archived → expired (best guess)
UPDATE matches
SET archive_reason = 'expired'
WHERE archived_at IS NOT NULL
  AND archive_reason IS NULL;
