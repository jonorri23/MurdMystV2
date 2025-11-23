-- Add venue analysis columns to parties table
ALTER TABLE parties 
ADD COLUMN IF NOT EXISTS venue_images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS venue_analysis jsonb DEFAULT '{}'::jsonb;

-- Create side_quests table for social engineering missions
CREATE TABLE IF NOT EXISTS side_quests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
    party_id uuid REFERENCES parties(id) ON DELETE CASCADE,
    content text NOT NULL,
    type text NOT NULL CHECK (type IN ('mission', 'secret', 'icebreaker')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    target_character_id uuid REFERENCES characters(id) ON DELETE SET NULL, -- Optional target for the mission
    created_at timestamptz DEFAULT now()
);

-- Create rumors table for the "Rumor Mill" feature
CREATE TABLE IF NOT EXISTS rumors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    party_id uuid REFERENCES parties(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_true boolean NOT NULL,
    source_character_id uuid REFERENCES characters(id) ON DELETE SET NULL, -- Who "started" the rumor (optional)
    unlocked_by_character_ids uuid[] DEFAULT '{}', -- Who knows this rumor
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for new tables (copying pattern from existing tables if needed, but keeping it simple for now)
ALTER TABLE side_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rumors ENABLE ROW LEVEL SECURITY;

-- Policies (assuming public access for MVP/Host for now, similar to other tables likely)
CREATE POLICY "Allow public read access" ON side_quests FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON side_quests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON side_quests FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON rumors FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON rumors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON rumors FOR UPDATE USING (true);
