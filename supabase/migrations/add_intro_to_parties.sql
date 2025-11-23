-- Add intro column to parties table for the "Read to Guests" text
ALTER TABLE parties 
ADD COLUMN IF NOT EXISTS intro text;
