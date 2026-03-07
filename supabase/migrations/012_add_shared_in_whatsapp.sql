ALTER TABLE matches ADD COLUMN shared_in_whatsapp boolean NOT NULL DEFAULT false;
CREATE INDEX idx_matches_shared_wa ON matches (shared_in_whatsapp) WHERE shared_in_whatsapp = true;
-- Backfill: any match that came from WhatsApp was publicly shared
UPDATE matches SET shared_in_whatsapp = true
  WHERE source_group IS NOT NULL AND source_group != 'playtomic_api' AND source_group != 'manual';
