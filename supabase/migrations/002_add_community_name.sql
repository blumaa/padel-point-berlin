-- Add community_name to raw_messages so the replay script can use it for venue fallback.
-- Nullable: messages from non-community groups won't have a parent community.
ALTER TABLE raw_messages
  ADD COLUMN IF NOT EXISTS community_name text;
