-- Remove bare action words stored as venue names (MATCH, GAME, PARTIDO, JUEGO).
-- These were produced by normalizeVenue before the bare-action guard was added.
UPDATE matches
SET venue = NULL
WHERE venue ~* '^(match|game|partido|juego)$';
