-- Add missing columns to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS intro text;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS solution_metadata jsonb;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS target_duration text;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS complexity text;

-- Create physical_clue_codes table
CREATE TABLE IF NOT EXISTS physical_clue_codes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  party_id uuid references parties(id) on delete cascade not null,
  clue_index integer not null,
  unlock_code text not null,
  unlocked_content jsonb not null,
  broadcast_to_all boolean default false
);

-- Disable RLS for physical_clue_codes (for MVP)
ALTER TABLE physical_clue_codes DISABLE ROW LEVEL SECURITY;

-- Add realtime support for physical_clue_codes
alter publication supabase_realtime add table physical_clue_codes;
