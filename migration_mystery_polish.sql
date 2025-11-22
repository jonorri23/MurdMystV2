# Database Migration - Add Mystery Polish Fields

Run this SQL in your Supabase SQL Editor:

```sql
-- Add new columns to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS victim jsonb;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS physical_clues jsonb;

-- Add new columns to characters table
ALTER TABLE characters ADD COLUMN IF NOT EXISTS relationships jsonb;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS quirks jsonb;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS opening_action text;
```

These columns will store:
- **victim**: Object with name, role, causeOfDeath, timeOfDeath, location, backstory
 **physical_clues**: Array of {description, setupInstruction, content, timing, relatedTo}
- **relationships**: Array of {character, relationship} for each character
- **quirks**: Array of behavioral quirks/props
- **opening_action**: Specific dramatic action to do at start of game
