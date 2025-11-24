-- Migration for MurdMystV2 Enhancements

-- 1. Add Solution Metadata & Props to Parties
ALTER TABLE parties ADD COLUMN IF NOT EXISTS solution_metadata jsonb;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS available_props text;

-- 1b. Add Advanced Planning Inputs
ALTER TABLE parties ADD COLUMN IF NOT EXISTS target_duration text DEFAULT '60-90 minutes';
ALTER TABLE parties ADD COLUMN IF NOT EXISTS complexity text DEFAULT 'balanced';
ALTER TABLE parties ADD COLUMN IF NOT EXISTS min_solution_paths integer DEFAULT 2;

-- 2. Store PIN codes for physical clues
CREATE TABLE IF NOT EXISTS physical_clue_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  clue_index INTEGER NOT NULL,
  unlock_code VARCHAR(10) NOT NULL,
  unlocked_content JSONB NOT NULL, -- { type: 'clue' | 'message' | 'reveal', content: '...' }
  broadcast_to_all BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, clue_index)
);

-- 3. Track which codes have been unlocked
CREATE TABLE IF NOT EXISTS clue_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  clue_code_id UUID REFERENCES physical_clue_codes(id) ON DELETE CASCADE,
  unlocked_by_guest_id UUID REFERENCES guests(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clue_unlocks_party ON clue_unlocks(party_id);
CREATE INDEX IF NOT EXISTS idx_clue_codes_party ON physical_clue_codes(party_id);
