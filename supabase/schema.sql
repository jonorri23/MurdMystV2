```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Parties Table
create table parties (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  host_pin text not null,
  status text not null check (status in ('planning', 'reviewing', 'active', 'completed')),
  setting_description text, -- Physical venue description
  story_theme text, -- Story/theme for the mystery
  created_at timestamp with time zone default now()
);

-- Guests Table
create table guests (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  party_id uuid references parties(id) on delete cascade not null,
  name text not null,
  personality_notes text,
  access_pin text not null,
  phone_number text,
  avatar_url text
);

-- Characters Table
create table characters (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  guest_id uuid references guests(id) on delete cascade not null,
  name text not null,
  role text not null,
  backstory text not null,
  secret_objective text not null,
  portrait_url text,
  relationships jsonb, -- Array of {character, relationship}
  quirks jsonb, -- Array of behavioral quirks/props
  opening_action text -- Specific action to do at start
);

-- Game Events Table
create table game_events (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  party_id uuid references parties(id) on delete cascade not null,
  event_type text not null default 'clue',
  content text not null,
  trigger_time timestamp with time zone,
  target_guest_ids uuid[], -- null = all guests, otherwise specific guest IDs
  metadata jsonb
);

-- Messages Table (In-game chat/secrets)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  party_id uuid references parties(id) on delete cascade not null,
  sender_type text not null check (sender_type in ('host', 'guest', 'system')),
  sender_id text,
  content text not null,
  is_private boolean default false
);

-- Realtime subscriptions
alter publication supabase_realtime add table parties;
alter publication supabase_realtime add table game_events;
alter publication supabase_realtime add table messages;

-- SQL to add new columns to existing database:
ALTER TABLE parties ADD COLUMN IF NOT EXISTS victim jsonb;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS physical_clues jsonb;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS relationships jsonb;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS quirks jsonb;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS opening_action text;

-- Disable RLS on all tables (for MVP)
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
