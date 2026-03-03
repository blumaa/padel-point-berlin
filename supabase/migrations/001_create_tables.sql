-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Raw WhatsApp messages (audit + replay)
create table raw_messages (
  id uuid primary key default gen_random_uuid(),
  whatsapp_group_name text not null,
  sender text,
  body text not null,
  message_timestamp timestamptz,
  received_at timestamptz not null default now(),
  processed boolean not null default false,
  parse_error text
);

create index idx_raw_messages_received_at on raw_messages (received_at);

-- Parsed matches (search index)
create table matches (
  id uuid primary key default gen_random_uuid(),
  playtomic_id text unique,
  raw_message_id uuid references raw_messages(id),
  title text not null default '',
  match_type text not null check (match_type in ('match', 'class', 'unknown')),
  match_time timestamptz not null,
  duration_min integer,
  venue text,
  level_min real,
  level_max real,
  category text not null default 'Open' check (category in ('Open', 'Women', 'Men', 'Mixed')),
  source_group text,
  playtomic_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_matches_match_time on matches (match_time);
create index idx_matches_playtomic_id on matches (playtomic_id);

-- Players per match
create table match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  name text not null default '',
  level real,
  status text not null check (status in ('confirmed', 'open')),
  slot_order integer not null
);

create index idx_match_players_match_id on match_players (match_id);

-- Auto-update updated_at on matches
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger matches_updated_at
  before update on matches
  for each row
  execute function update_updated_at();
