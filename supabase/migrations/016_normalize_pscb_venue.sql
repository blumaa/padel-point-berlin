-- Normalize "PSCB Padel Social Club Berlin" to canonical "PBC Center"
UPDATE matches
SET venue = 'PBC Center'
WHERE venue ILIKE '%PSCB%'
   OR venue ILIKE '%Social Club%';
