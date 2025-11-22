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
  portrait_url text
);

-- Game Events Table
create table game_events (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  party_id uuid references parties(id) on delete cascade not null,
  trigger_time timestamp with time zone,
  event_type text not null check (event_type in ('clue', 'announcement', 'secret')),
  content text not null,
  target_guest_ids uuid[] -- Array of guest IDs who receive this (null = all guests)
);

-- Messages Table (In-game chat/secrets)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  party_id uuid references parties(id) on delete cascade not null,
  sender_character_id uuid references characters(id) on delete set null,
  recipient_character_id uuid references characters(id) on delete set null,
  content text not null
);

-- Realtime subscriptions
alter publication supabase_realtime add table parties;
alter publication supabase_realtime add table game_events;
alter publication supabase_realtime add table messages;
