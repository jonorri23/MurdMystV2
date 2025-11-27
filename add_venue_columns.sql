-- Add missing columns for venue analysis
ALTER TABLE parties ADD COLUMN IF NOT EXISTS venue_images text[];
ALTER TABLE parties ADD COLUMN IF NOT EXISTS venue_analysis jsonb;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS available_props text;
