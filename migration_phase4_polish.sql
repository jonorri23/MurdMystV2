-- Migration for Phase 4: Premium Party Polish

-- 1. Add Playlist to Parties
ALTER TABLE parties ADD COLUMN IF NOT EXISTS playlist jsonb; 
-- Structure: [{ title: "Song", artist: "Artist", reason: "Why it fits" }]

-- 2. Add Recap to Parties
ALTER TABLE parties ADD COLUMN IF NOT EXISTS game_recap jsonb;
-- Structure: { summary: "...", mvp: "...", timeline: [...] }
