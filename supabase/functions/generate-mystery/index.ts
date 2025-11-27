import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `
You are an expert murder mystery game designer specializing in **social engineering**, **interactive party dynamics**, and **logical deduction**. Your goal is to create a mystery that is not just dramatic, but **fairly solvable** through evidence and deduction.

The host will provide:
1. **Story/Theme**: A theme or concept (e.g. "Pokemon", "1920s Gatsby", "Sci-fi"). Expand this into a rich, dramatic mystery.
2. **Guest List**: Names + optional personality notes.
3. **Physical Venue**: The REAL location where the party is happening. Use this to create location-based clues.
4. **Venue Analysis**: Detailed list of furniture and hiding spots (if available).

**CRITICAL: You MUST respond with valid JSON containing ALL of these fields:**
1. "title": A catchy, thematic title.
2. "intro": A dramatic 2-3 paragraph introduction.
3. "victim": WHO DIED - name, role, cause of death, time, location.
4. "characters": Array of character objects for EACH guest.
5. "physicalClues": Array of 5-8 physical clue setup instructions.
6. "clues": Array of 3-5 in-app clues/messages.
7. **"solutionMetadata"**: Detailed logic breakdown (NEW & CRITICAL).

---

## SOLUTION METADATA (CRITICAL FOR GAMEPLAY)

You MUST generate a "solutionMetadata" object that proves the mystery is solvable. It must include:
- **"completeSolution"**:
  - "steps": Array of logical steps to solve it (e.g. "1. Find knife, 2. Note missing apron, 3. Deduce Chef").
  - "estimatedTime": String (e.g. "45-60 minutes").
  - "criticalClues": Array of clue IDs or descriptions that are ESSENTIAL.
- **"alternativePaths"**: Array of 2 other ways to solve it (e.g. "By alibi elimination", "By motive discovery").
- **"timeline"**:
  - "murderTime": Specific time (e.g. "7:30 PM").
  - "bodyDiscovery": Time found.
  - "eventSequence": Array of strings describing exactly what happened when.
- **"difficultyRating"**: "easy" | "medium" | "hard".
- **"redHerrings"**: Array of elements that mislead but don't break logic.

**LOGIC RULES:**
1. **Solvability**: The murderer MUST be deducible from the clues. No "lucky guesses".
2. **Timeline Consistency**: Alibis must match the murder time. No teleporting characters.
3. **Non-Linearity**: Ensure clues can be found in different orders without breaking the story.

---

## VICTIM (The Murder)
- "name", "role", "causeOfDeath", "timeOfDeath", "location", "backstory".
- The victim is NOT a guest.

---

## CHARACTER STRUCTURE
Each character object MUST have:
- "guestName": Real guest name.
- "roleName": Character name.
- "roleDescription": Public description.
- "backstory": Rich paragraph with secrets.
- "secret": A specific secret they hide.
- "objective": A goal forcing interaction.
- "isMurderer": Boolean (exactly one true).
- **"relationships"**: Array of [{ "character": "RoleName", "relationship": "..." }].
- **"quirks"**: Array of behavioral quirks/props.
- **"openingAction"**: A specific dramatic action to start.

**CRITICAL VALIDATION RULES:**
- Generate EXACTLY ONE character per guest - NO DUPLICATES!
- EVERY character MUST include ALL fields listed above - NO PARTIAL OBJECTS!
- The "backstory" field must be COMPLETE, not truncated.
- Verify you have the correct number of characters before returning.

---

## PHYSICAL CLUE INSTRUCTIONS
Generate 5-8 physical clues. Each must have:
- "description": What it is.
- "setupInstruction": WHERE and HOW to place it (USE REAL VENUE DETAILS).
- "content": Text/appearance.
- "timing": "pre-dinner" | "post-murder".
- "relatedTo": Array of character roles.
- **"hasUnlockCode"**: Boolean (true if this clue has a PIN code).
- **"unlockCode"**: String (4-digit PIN) if hasUnlockCode is true.
- **"unlockedContent"**: Object { "type": "clue"|"message", "content": "...", "broadcastToAll": boolean } if hasUnlockCode is true.

**PIN SYSTEM**:
- Some physical clues should have a PIN code printed on them (e.g. "Code: 1234").
- When players enter this code in the app, they get extra info or a broadcast message.
- Use this for: Locked diaries, encrypted files, voice messages, or "You found the murder weapon!" announcements.

---

## IN-APP CLUES
Generate 3-5 in-app messages.
- "content", "suggestedTiming", "targetRoles".

---

## CRITICAL RULES - SOCIAL ENGINEERING
- **Force interactions**: Objectives must require talking to SPECIFIC people.
- **Create conflicts**: Debts, romance, grudges.
- **Information asymmetry**: Some characters know things others don't.
- **Moral dilemmas**: Loyalty vs truth.

## CRITICAL RULES - PHYSICAL CLUES
- **Use the actual venue**: Reference REAL objects.
- **Be creative**: "Under the DJ deck", "Inside the vase".
- **Make them discoverable**: Not too hidden.

## CRITICAL RULES - THEME
- **Embrace the theme**: Use specific vocabulary.
- **Stay grounded**: Clues are physical objects.
`;

const MYSTERY_SCHEMA = {
    type: "json_schema",
    json_schema: {
        name: "mystery_schema",
        strict: true,
        schema: {
            type: "object",
            properties: {
                title: { type: "string", description: "The mystery title" },
                intro: { type: "string", description: "The opening scene description" },
                victim: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        causeOfDeath: { type: "string" },
                        timeOfDeath: { type: "string" },
                        location: { type: "string" },
                        backstory: { type: "string" }
                    },
                    required: ["name", "role", "causeOfDeath", "timeOfDeath", "location", "backstory"],
                    additionalProperties: false
                },
                characters: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            guestName: { type: "string", description: "Real guest name" },
                            roleName: { type: "string", description: "Character name" },
                            roleDescription: { type: "string", description: "Character description" },
                            backstory: { type: "string" },
                            secret: { type: "string" },
                            objective: { type: "string" },
                            isMurderer: { type: "boolean" },
                            relationships: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        character: { type: "string", description: "Role name of the other character" },
                                        relationship: { type: "string", description: "Description of the relationship" }
                                    },
                                    required: ["character", "relationship"],
                                    additionalProperties: false
                                }
                            },
                            quirks: { type: "array", items: { type: "string" } },
                            openingAction: { type: "string", description: "A specific dramatic action to do at the start" }
                        },
                        required: ["guestName", "roleName", "roleDescription", "backstory", "secret", "objective", "isMurderer", "relationships", "quirks", "openingAction"],
                        additionalProperties: false
                    }
                },
                physicalClues: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            description: { type: "string", description: "What the clue is" },
                            setupInstruction: { type: "string", description: "Where and how to place it in the venue" },
                            content: { type: "string", description: "The actual text/appearance of the clue" },
                            timing: { type: "string", enum: ["pre-dinner", "post-murder"] },
                            relatedTo: { type: "array", items: { type: "string" } },
                            hasUnlockCode: { type: "boolean" },
                            unlockCode: { type: ["string", "null"] },
                            unlockedContent: {
                                type: ["object", "null"],
                                properties: {
                                    type: { type: "string", enum: ["clue", "message", "reveal"] },
                                    content: { type: "string" },
                                    broadcastToAll: { type: "boolean" }
                                },
                                required: ["type", "content", "broadcastToAll"],
                                additionalProperties: false
                            }
                        },
                        required: ["description", "setupInstruction", "content", "timing", "relatedTo", "hasUnlockCode", "unlockCode", "unlockedContent"],
                        additionalProperties: false
                    }
                },
                clues: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            content: { type: "string" },
                            suggestedTiming: { type: "string" },
                            targetRoles: { type: "array", items: { type: "string" } }
                        },
                        required: ["content", "suggestedTiming", "targetRoles"],
                        additionalProperties: false
                    }
                },
                solutionMetadata: {
                    type: "object",
                    properties: {
                        completeSolution: {
                            type: "object",
                            properties: {
                                steps: { type: "array", items: { type: "string" } },
                                estimatedTime: { type: "string" },
                                criticalClues: { type: "array", items: { type: "string" } }
                            },
                            required: ["steps", "estimatedTime", "criticalClues"],
                            additionalProperties: false
                        },
                        alternativePaths: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    description: { type: "string" },
                                    clues: { type: "array", items: { type: "string" } },
                                    estimatedTime: { type: "string" }
                                },
                                required: ["description", "clues", "estimatedTime"],
                                additionalProperties: false
                            }
                        },
                        timeline: {
                            type: "object",
                            properties: {
                                murderTime: { type: "string" },
                                bodyDiscovery: { type: "string" },
                                eventSequence: { type: "array", items: { type: "string" } }
                            },
                            required: ["murderTime", "bodyDiscovery", "eventSequence"],
                            additionalProperties: false
                        },
                        difficultyRating: { type: "string", enum: ["easy", "medium", "hard"] },
                        redHerrings: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    element: { type: "string" },
                                    purpose: { type: "string" }
                                },
                                required: ["element", "purpose"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["completeSolution", "alternativePaths", "timeline", "difficultyRating", "redHerrings"],
                    additionalProperties: false
                }
            },
            required: ["title", "intro", "victim", "characters", "physicalClues", "clues", "solutionMetadata"],
            additionalProperties: false
        }
    }
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { partyId } = await req.json()

        if (!partyId) {
            throw new Error('partyId is required')
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Fetch party and guests
        const { data: party, error: partyError } = await supabase
            .from('parties')
            .select('*')
            .eq('id', partyId)
            .single()

        if (partyError) throw partyError

        const { data: guests, error: guestsError } = await supabase
            .from('guests')
            .select('*')
            .eq('party_id', partyId)

        if (guestsError) throw guestsError
        if (!guests || guests.length === 0) throw new Error('No guests found')

        // Call OpenAI API
        const openaiKey = Deno.env.get('OPENAI_API_KEY')!

        const venueContext = party.venue_analysis
            ? `\nVENUE ANALYSIS (CRITICAL: You MUST use these details for hiding spots. Do NOT invent furniture not listed here):\n${JSON.stringify(party.venue_analysis)}`
            : ''

        const userPrompt = `
    Story/Theme: ${party.story_theme || party.name}
    Physical Venue: ${party.setting_description || 'A typical room'}
    ${venueContext}
    Guests:
    ${guests.map((g: any) => `- ${g.name} (${g.personality_notes || 'No notes'})`).join('\n')}
Party Name: ${party.name}
Theme: ${party.story_theme || 'murder mystery'}
Physical Venue: ${party.setting_description || 'a house'}

PLANNING CONSTRAINTS:
- Target Duration: ${party.target_duration || '60-90 minutes'}
- Complexity Level: ${party.complexity || 'balanced'}
- Minimum Solution Paths: ${party.min_solution_paths || 2} (Ensure there are at least this many valid ways to deduce the killer)

Guests (${guests.length}):
${guests.map((g: any) => `- ${g.name}${g.personality_notes ? ` (${g.personality_notes})` : ''}`).join('\n')}

Generate a complete murder mystery with:
- A victim and murder scenario
- Character roles for ALL ${guests.length} guests (with relationships, quirks, opening actions)
- Physical clue setup instructions for the host (STRICTLY USE VENUE ANALYSIS OBJECTS IF AVAILABLE)
- In-app clues for during the game
- A solution that respects the complexity and duration constraints

Make it dramatic, interactive, and perfectly tailored to this venue and theme!
  `

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt }
                ],
                response_format: MYSTERY_SCHEMA,
                temperature: 0.8,
            }),
        })

        const aiResult = await response.json()

        if (aiResult.error) {
            console.error('OpenAI Error:', aiResult.error)
            throw new Error(`OpenAI Error: ${aiResult.error.message}`)
        }

        const mysteryData = JSON.parse(aiResult.choices[0].message.content)

        // Save to database
        await supabase
            .from('parties')
            .update({
                status: 'reviewing',
                victim: mysteryData.victim,
                physical_clues: mysteryData.physicalClues,
                intro: mysteryData.intro,
                solution_metadata: mysteryData.solutionMetadata
            })
            .eq('id', partyId)

        // Save Physical Clue PIN Codes
        const pinCodeInserts = mysteryData.physicalClues
            .map((clue: any, index: number) => {
                if (clue.hasUnlockCode && clue.unlockCode && clue.unlockedContent) {
                    return {
                        party_id: partyId,
                        clue_index: index,
                        unlock_code: clue.unlockCode,
                        unlocked_content: clue.unlockedContent,
                        broadcast_to_all: clue.unlockedContent.broadcastToAll || false
                    }
                }
                return null
            })
            .filter(Boolean)

        if (pinCodeInserts.length > 0) {
            await supabase.from('physical_clue_codes').delete().eq('party_id', partyId)
            const { error: pinError } = await supabase
                .from('physical_clue_codes')
                .insert(pinCodeInserts)

            if (pinError) console.error('Error inserting PIN codes:', pinError)
        }

        // Create characters
        const characterInserts = []
        for (let i = 0; i < mysteryData.characters.length; i++) {
            const char = mysteryData.characters[i]
            // Try exact match first, then case-insensitive, then fuzzy match by index
            let guest = guests.find((g: any) => g.name === char.guestName);

            if (!guest) {
                guest = guests.find((g: any) => g.name.toLowerCase().trim() === char.guestName.toLowerCase().trim());
            }

            if (!guest) {
                guest = guests[i];
            }

            if (guest) {
                // Generate portrait
                let portraitUrl = null
                try {
                    const imagePrompt = `A digital painting of a murder mystery character: ${char.roleName}, ${char.roleDescription}. ${party.story_theme || 'Mystery theme'}. Style: Oil painting, mysterious, noir. High quality, detailed.`

                    const imgResponse = await fetch('https://api.openai.com/v1/images/generations', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${openaiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: 'dall-e-3',
                            prompt: imagePrompt,
                            n: 1,
                            size: '1024x1024',
                            quality: 'standard',
                        }),
                    })

                    const imgResult = await imgResponse.json()
                    portraitUrl = imgResult.data?.[0]?.url || null
                } catch (error) {
                    console.error(`Failed to generate portrait for ${char.roleName}:`, error)
                }

                characterInserts.push({
                    guest_id: guest.id,
                    name: char.roleName,
                    role: char.roleDescription,
                    backstory: char.backstory,
                    secret_objective: char.objective + (char.isMurderer ? " YOU ARE THE MURDERER." : ""),
                    relationships: char.relationships || [],
                    quirks: char.quirks || [],
                    opening_action: char.openingAction || null,
                    portrait_url: portraitUrl
                })
            }
        }

        if (characterInserts.length > 0) {
            await supabase.from('characters').insert(characterInserts)
        }

        // Create Pre-generated Clues (Game Events)
        const clueInserts = mysteryData.clues.map((clue: any) => {
            let targetGuestIds: string[] | null = null
            if (clue.targetRoles && clue.targetRoles.length > 0) {
                const targetGuests = guests.filter((g: any) => {
                    const charForGuest = mysteryData.characters.find((c: any) => c.guestName === g.name)
                    return charForGuest && clue.targetRoles.includes(charForGuest.roleName)
                })
                targetGuestIds = targetGuests.map((g: any) => g.id)
            }

            return {
                party_id: partyId,
                event_type: 'clue',
                content: `[${clue.suggestedTiming}] ${clue.content}`,
                target_guest_ids: targetGuestIds,
                trigger_time: null,
            }
        })

        if (clueInserts.length > 0) {
            await supabase.from('game_events').insert(clueInserts)
        }

        return new Response(
            JSON.stringify({ success: true, partyId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
