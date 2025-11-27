'use server'

import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function createParty(formData: FormData) {
    const name = formData.get('name') as string
    const hostPin = formData.get('hostPin') as string

    if (!name || !hostPin) {
        throw new Error('Name and Host PIN are required')
    }

    const { data, error } = await supabase
        .from('parties')
        .insert([
            {
                name,
                host_pin: hostPin,
                status: 'planning',
                // Defaults for other fields
                setting_description: 'A typical room',
                story_theme: 'A classic murder mystery',
                target_duration: '60-90 minutes',
                complexity: 'balanced',
                min_solution_paths: 2
            },
        ])
        .select()
        .single()

    if (error) {
        console.error('Error creating party:', error)
        throw new Error('Failed to create party')
    }

    redirect(`/host/${data.id}/dashboard`)
}

export async function joinParty(formData: FormData) {
    const partyId = formData.get('partyId') as string
    const name = formData.get('name') as string
    const personality = formData.get('personality') as string
    const accessPin = formData.get('accessPin') as string

    if (!partyId || !name || !accessPin) {
        throw new Error('Missing required fields')
    }

    const { data, error } = await supabase
        .from('guests')
        .insert([
            {
                party_id: partyId,
                name,
                personality_notes: personality,
                access_pin: accessPin
            },
        ])
        .select()
        .single()

    if (error) {
        console.error('Error joining party:', error)
        throw new Error('Failed to join party')
    }

    redirect(`/party/${partyId}/guest/${data.id}`)
}

export async function loginHost(formData: FormData) {
    const partyId = formData.get('partyId') as string
    const hostPin = formData.get('hostPin') as string

    if (!partyId || !hostPin) {
        throw new Error('Missing required fields')
    }

    const { data, error } = await supabase
        .from('parties')
        .select('id')
        .eq('id', partyId)
        .eq('host_pin', hostPin)
        .single()

    if (error || !data) {
        throw new Error('Invalid PIN')
    }

    // In a real app, set a secure cookie here.
    // For MVP, we just redirect. The user might need to re-login if they lose the URL,
    // but the URL itself /host/[id]/dashboard is "protected" by obscurity for now?
    // Actually, let's set a simple cookie using 'next/headers'

    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('murd_host_session', partyId)

    redirect(`/host/${partyId}/dashboard`)
}

export async function loginGuest(formData: FormData) {
    const partyId = formData.get('partyId') as string
    const accessPin = formData.get('accessPin') as string

    if (!partyId || !accessPin) {
        throw new Error('Missing required fields')
    }

    // We need to find the guest in this party with this PIN
    const { data, error } = await supabase
        .from('guests')
        .select('id')
        .eq('party_id', partyId)
        .eq('access_pin', accessPin)
        .single()

    if (error || !data) {
        throw new Error('Invalid PIN')
    }

    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set(`murd_guest_session_${partyId}`, data.id)

    redirect(`/party/${partyId}/guest/${data.id}`)
}

export async function generateMystery(partyId: string) {
    const { openai } = await import('@ai-sdk/openai')
    const { generateObject } = await import('ai')
    const { z } = await import('zod')
    const { SYSTEM_PROMPT } = await import('@/lib/prompts')

    // 1. Fetch Party and Guests
    const { data: party } = await supabase
        .from('parties')
        .select('*')
        .eq('id', partyId)
        .single()

    const { data: guests } = await supabase
        .from('guests')
        .select('*')
        .eq('party_id', partyId)

    if (!party || !guests || guests.length === 0) {
        throw new Error('Party or guests not found')
    }

    // Define schema
    const schema = z.object({
        title: z.string().describe('The mystery title'),
        intro: z.string().describe('The opening scene description'),
        victim: z.object({
            name: z.string(),
            role: z.string(),
            causeOfDeath: z.string(),
            timeOfDeath: z.string(),
            location: z.string(),
            backstory: z.string()
        }).describe('The murder victim - NOT a guest'),
        characters: z.array(z.object({
            guestName: z.string().describe('Real guest name'),
            roleName: z.string().describe('Character name'),
            roleDescription: z.string().describe('Character description'),
            backstory: z.string(),
            secret: z.string(),
            objective: z.string(),
            isMurderer: z.boolean(),
            relationships: z.array(z.object({
                character: z.string().describe('Role name of the other character'),
                relationship: z.string().describe('Description of the relationship')
            })).describe('Relationships to other characters'),
            quirks: z.array(z.string()).describe('Behavioral quirks and props'),
            openingAction: z.string().describe('A specific dramatic action to do at the start')
        })),
        physicalClues: z.array(z.object({
            description: z.string().describe('What the clue is'),
            setupInstruction: z.string().describe('Where and how to place it in the venue'),
            content: z.string().describe('The actual text/appearance of the clue'),
            timing: z.enum(['pre-dinner', 'post-murder']).describe('When it should be found'),
            relatedTo: z.array(z.string()).describe('Character role names this clue relates to'),
            hasUnlockCode: z.boolean().describe('Whether this clue has a PIN to unlock digital content'),
            unlockCode: z.string().nullable().describe('4-digit PIN code printed on the physical clue'),
            unlockedContent: z.object({
                type: z.enum(['clue', 'message', 'reveal']),
                content: z.string(),
                broadcastToAll: z.boolean().describe('If true, sends message to all players')
            }).nullable()
        })).describe('Physical clues for the host to set up'),
        clues: z.array(z.object({
            content: z.string(),
            suggestedTiming: z.string(),
            targetRoles: z.array(z.string())
        })).describe('In-app clues that appear during the game'),
        solutionMetadata: z.object({
            completeSolution: z.object({
                steps: z.array(z.string()),
                estimatedTime: z.string(),
                criticalClues: z.array(z.string())
            }),
            alternativePaths: z.array(z.object({
                description: z.string(),
                clues: z.array(z.string()),
                estimatedTime: z.string()
            })),
            timeline: z.object({
                murderTime: z.string(),
                bodyDiscovery: z.string(),
                eventSequence: z.array(z.string())
            }),
            difficultyRating: z.enum(['easy', 'medium', 'hard']),
            redHerrings: z.array(z.object({
                element: z.string(),
                purpose: z.string()
            }))
        })
    })

    // 2. Call AI
    const { data: partyWithAnalysis } = await supabase
        .from('parties')
        .select('venue_analysis')
        .eq('id', partyId)
        .single()

    const venueContext = partyWithAnalysis?.venue_analysis
        ? `\nVENUE ANALYSIS (CRITICAL: You MUST use these details for hiding spots. Do NOT invent furniture not listed here):\n${JSON.stringify(partyWithAnalysis.venue_analysis)}`
        : ''

    const prompt = `
    Story/Theme: ${party.story_theme || party.name}
    Physical Venue: ${party.setting_description || 'A typical room'}
    ${venueContext}
    Guests:
    ${guests.map(g => `- ${g.name} (${g.personality_notes || 'No notes'})`).join('\n')}
Party Name: ${party.name}
Theme: ${party.story_theme || 'murder mystery'}
Physical Venue: ${party.setting_description || 'a house'}

PLANNING CONSTRAINTS:
- Target Duration: ${party.target_duration || '60-90 minutes'}
- Complexity Level: ${party.complexity || 'balanced'}
- Minimum Solution Paths: ${party.min_solution_paths || 2} (Ensure there are at least this many valid ways to deduce the killer)

Guests (${guests.length}):
${guests.map(g => `- ${g.name}${g.personality_notes ? ` (${g.personality_notes})` : ''}`).join('\n')}

Generate a complete murder mystery with:
- A victim and murder scenario
- Character roles for ALL ${guests.length} guests (with relationships, quirks, opening actions)
- Physical clue setup instructions for the host (STRICTLY USE VENUE ANALYSIS OBJECTS IF AVAILABLE)
- In-app clues for during the game
- A solution that respects the complexity and duration constraints

Make it dramatic, interactive, and perfectly tailored to this venue and theme!
  `

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        system: SYSTEM_PROMPT,
        prompt: prompt,
        schema: schema,
    })

    // Filter out any incomplete characters (missing required fields)
    // This handles cases where the AI generates partial/duplicate characters
    const validCharacters = object.characters.filter((char: any) => {
        const hasAllRequiredFields =
            char.guestName &&
            char.roleName &&
            char.roleDescription &&
            char.backstory &&
            char.secret &&
            char.objective &&
            typeof char.isMurderer === 'boolean' &&
            Array.isArray(char.relationships) &&
            Array.isArray(char.quirks) &&
            char.openingAction;

        if (!hasAllRequiredFields) {
            console.warn(`Filtering out incomplete character: ${char.roleName || 'unknown'} for guest ${char.guestName || 'unknown'}`);
        }

        return hasAllRequiredFields;
    });

    // Update the object with filtered characters
    object.characters = validCharacters;

    // Validate we have enough characters
    if (validCharacters.length !== guests.length) {
        console.error(`Warning: Generated ${validCharacters.length} valid characters but expected ${guests.length}`);
        // Optionally throw an error if this is critical
        // throw new Error(`AI generated incomplete characters. Expected ${guests.length}, got ${validCharacters.length} valid ones.`);
    }

    // 3. Save to Database
    // Update Party to reviewing status (not active yet!)
    // Update Party status to 'reviewing' and save victim info and physical clues
    await supabase
        .from('parties')
        .update({
            status: 'reviewing',
            victim: object.victim,
            physical_clues: object.physicalClues,
            intro: object.intro,
            solution_metadata: object.solutionMetadata
        })
        .eq('id', partyId)

    // Save Physical Clue PIN Codes
    const pinCodeInserts = object.physicalClues
        .map((clue, index) => {
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
        // Clear existing codes for this party first (in case of regeneration)
        await supabase.from('physical_clue_codes').delete().eq('party_id', partyId)

        const { error: pinError } = await supabase
            .from('physical_clue_codes')
            .insert(pinCodeInserts as any)

        if (pinError) console.error('Error inserting PIN codes:', pinError)
    }

    // Create Characters and Generate Portraits
    console.log('=== MATCHING GUESTS TO CHARACTERS ===');
    console.log('Available guests:', guests.map(g => ({ id: g.id, name: g.name })));
    console.log('AI generated characters for:', object.characters.map((c: any) => c.guestName));

    const characterInserts = await Promise.all(object.characters.map(async (char: any, index: number) => {
        // Try exact match first, then case-insensitive, then fuzzy match by index
        let guest = guests.find(g => g.name === char.guestName);

        if (!guest) {
            // Try case-insensitive match
            guest = guests.find(g => g.name.toLowerCase().trim() === char.guestName.toLowerCase().trim());
        }

        if (!guest) {
            // Fallback: match by index (order)
            console.warn(`Could not find guest "${char.guestName}" by name, using index ${index}`);
            guest = guests[index];
        }

        if (!guest) {
            console.error(`CRITICAL: No guest found for character ${char.roleName} (guestName: ${char.guestName})`);
            return null;
        }

        console.log(`Matched "${char.guestName}" → Guest "${guest.name}" (${guest.id})`);

        // Generate portrait using dall-e-3
        let portraitUrl = null
        try {
            const OpenAI = (await import('openai')).default
            const client = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            })

            const imagePrompt = `A digital painting of a murder mystery character: ${char.roleName}, ${char.roleDescription}. ${party.story_theme || 'Mystery theme'}. Style: Oil painting, mysterious, noir. High quality, detailed.`

            const response = await client.images.generate({
                model: 'dall-e-3',
                prompt: imagePrompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
            })

            portraitUrl = response.data?.[0]?.url || null
        } catch (error) {
            console.error(`Failed to generate portrait for ${char.roleName}:`, error)
            // Continue without portrait
        }

        return {
            guest_id: guest.id,
            name: char.roleName,
            role: char.roleDescription,
            backstory: char.backstory,
            secret_objective: char.objective + (char.isMurderer ? " YOU ARE THE MURDERER." : ""),
            portrait_url: portraitUrl,
            relationships: char.relationships || [],
            quirks: char.quirks || [],
            opening_action: char.openingAction || null
        }
    }))

    const validCharacterInserts = characterInserts.filter(Boolean)

    console.log('=== CHARACTER INSERT DEBUG ===');
    console.log('Number of characters to insert:', validCharacterInserts.length);
    console.log('Character inserts:', JSON.stringify(validCharacterInserts, null, 2));

    if (validCharacterInserts.length > 0) {
        const { error: charError, data: insertedChars } = await supabase
            .from('characters')
            .insert(validCharacterInserts as any)
            .select()

        console.log('Insert result - error:', charError);
        console.log('Insert result - data:', insertedChars);

        if (charError) {
            console.error('Error inserting characters:', charError)
            throw new Error(`Failed to create characters: ${charError.message}`)
        }
    }

    // Create Pre-generated Clues
    const clueInserts = object.clues.map((clue, index) => {
        // Find target guest IDs based on role names
        let targetGuestIds: string[] | null = null
        if (clue.targetRoles && clue.targetRoles.length > 0) {
            const targetGuests = guests.filter(g => {
                const charForGuest = object.characters.find(c => c.guestName === g.name)
                return charForGuest && clue.targetRoles.includes(charForGuest.roleName)
            })
            targetGuestIds = targetGuests.map(g => g.id)
        }

        return {
            party_id: partyId,
            event_type: 'clue',
            content: `[${clue.suggestedTiming}] ${clue.content}`,
            target_guest_ids: targetGuestIds,
            trigger_time: null, // Not sent yet, host will send manually
        }
    })

    if (clueInserts.length > 0) {
        await supabase
            .from('game_events')
            .insert(clueInserts)
    }

    const { revalidatePath } = await import('next/cache')
    redirect(`/host/${partyId}/review`)
}

export async function sendClue(formData: FormData) {
    const partyId = formData.get('partyId') as string
    const content = formData.get('content') as string
    const targetGuestIdsStr = formData.get('targetGuestIds') as string

    if (!partyId || !content) return

    // Parse target guest IDs (empty string or "all" means send to all)
    let targetGuestIds: string[] | null = null
    if (targetGuestIdsStr && targetGuestIdsStr !== 'all') {
        targetGuestIds = JSON.parse(targetGuestIdsStr)
    }

    await supabase
        .from('game_events')
        .insert([
            {
                party_id: partyId,
                event_type: 'clue',
                content,
                trigger_time: new Date().toISOString(),
                target_guest_ids: targetGuestIds,
            }
        ])

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/host/${partyId}/dashboard`)
}

export async function addGuest(formData: FormData) {
    const partyId = formData.get('partyId') as string
    const name = formData.get('name') as string
    const personalityNotes = formData.get('personalityNotes') as string

    if (!partyId || !name) {
        throw new Error('Party ID and name are required')
    }

    // Generate a 4-digit PIN
    const accessPin = Math.floor(1000 + Math.random() * 9000).toString()

    const { error } = await supabase
        .from('guests')
        .insert([
            {
                party_id: partyId,
                name,
                personality_notes: personalityNotes || null,
                access_pin: accessPin,
            }
        ])

    if (error) {
        console.error('Error adding guest:', error)
        throw new Error('Failed to add guest')
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/host/${partyId}/dashboard`)
}


export async function updatePartyDetails(formData: FormData) {
    const partyId = formData.get("partyId") as string
    const storyTheme = formData.get("storyTheme") as string
    const venueDescription = formData.get("venueDescription") as string
    const availableProps = formData.get("availableProps") as string
    const targetDuration = formData.get("targetDuration") as string
    const complexity = formData.get("complexity") as string
    const minPaths = formData.get("minPaths") as string

    await supabase
        .from("parties")
        .update({
            story_theme: storyTheme,
            setting_description: venueDescription,
            available_props: availableProps,
            target_duration: targetDuration,
            complexity: complexity,
            min_solution_paths: minPaths ? parseInt(minPaths) : 2
        })
        .eq("id", partyId)

    const { revalidatePath } = await import("next/cache")
    revalidatePath(`/host/${partyId}/dashboard`)
}

export async function updateCharacter(characterId: string, fields: {
    name?: string
    role?: string
    backstory?: string
    secret_objective?: string
    opening_action?: string
    relationships?: any[]
    quirks?: string[]
}) {
    const { error } = await supabase
        .from('characters')
        .update(fields)
        .eq('id', characterId)

    if (error) {
        throw new Error(`Failed to update character: ${error.message}`)
    }

    const { revalidatePath } = await import('next/cache')
    // We don't know the party ID here, but we can revalidate the entire path pattern
    revalidatePath('/host/[id]/review', 'page')
}

export async function updatePhysicalClue(partyId: string, clueIndex: number, clueData: any) {
    'use server'

    // 1. Fetch current clues
    const { data: party, error: fetchError } = await supabase
        .from('parties')
        .select('physical_clues')
        .eq('id', partyId)
        .single()

    if (fetchError || !party) {
        throw new Error('Failed to fetch party clues')
    }

    // 2. Update the specific clue
    const currentClues = (party.physical_clues as any[]) || []
    if (clueIndex >= 0 && clueIndex < currentClues.length) {
        currentClues[clueIndex] = { ...currentClues[clueIndex], ...clueData }
    }

    // 3. Save back to DB
    const { error: updateError } = await supabase
        .from('parties')
        .update({ physical_clues: currentClues })
        .eq('id', partyId)

    if (updateError) {
        throw new Error(`Failed to update clue: ${updateError.message}`)
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/host/${partyId}/review`)
}

export async function regenerateCharacter(characterId: string, prompt: string) {
    'use server'

    // 1. Fetch current character
    const { data: char, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single()

    if (fetchError || !char) {
        throw new Error('Failed to fetch character')
    }

    // 2. Call AI to regenerate
    const { generateObject } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')
    const { z } = await import('zod')

    const schema = z.object({
        name: z.string(),
        role: z.string(),
        backstory: z.string(),
        secret_objective: z.string(),
        opening_action: z.string(),
        quirks: z.array(z.string()),
        relationships: z.array(z.object({
            character: z.string(),
            relationship: z.string()
        }))
    })

    const systemPrompt = `You are an expert murder mystery writer. 
    Your task is to REWRITE a specific character based on the user's instruction.
    Keep the character fitting within the existing mystery theme.
    
    Current Character:
    Name: ${char.name}
    Role: ${char.role}
    Backstory: ${char.backstory}
    
    User Instruction: "${prompt}"
    
    Return a complete, valid JSON object for the updated character.`

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema,
        prompt: systemPrompt,
    })

    // 3. Update DB
    const { error: updateError } = await supabase
        .from('characters')
        .update({
            name: object.name,
            role: object.role,
            backstory: object.backstory,
            secret_objective: object.secret_objective,
            opening_action: object.opening_action,
            quirks: object.quirks,
            relationships: object.relationships
        })
        .eq('id', characterId)

    if (updateError) {
        throw new Error('Failed to update character')
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/host/[id]/review', 'page')
}

export async function regenerateClue(partyId: string, clueIndex: number, prompt: string) {
    'use server'

    // 1. Fetch current party
    const { data: party, error: fetchError } = await supabase
        .from('parties')
        .select('physical_clues, story_theme, victim')
        .eq('id', partyId)
        .single()

    if (fetchError || !party) {
        throw new Error('Failed to fetch party')
    }

    const currentClues = (party.physical_clues as any[]) || []
    const targetClue = currentClues[clueIndex]

    if (!targetClue) throw new Error('Clue not found')

    // 2. Call AI
    const { generateObject } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')
    const { z } = await import('zod')

    const schema = z.object({
        description: z.string(),
        setupInstruction: z.string(),
        content: z.string(),
        timing: z.enum(['pre-dinner', 'post-murder']),
        relatedTo: z.array(z.string())
    })

    const systemPrompt = `You are an expert murder mystery writer.
    Rewrite this physical clue based on the user's instruction.
    
    Theme: ${party.story_theme}
    Victim: ${JSON.stringify(party.victim)}
    Current Clue: ${JSON.stringify(targetClue)}
    
    User Instruction: "${prompt}"
    
    Return the updated clue object.`

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema,
        prompt: systemPrompt,
    })

    // 3. Update DB
    currentClues[clueIndex] = object

    await supabase
        .from('parties')
        .update({ physical_clues: currentClues })
        .eq('id', partyId)

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/host/${partyId}/review`, 'page')
}

export async function adjustStory(partyId: string, instruction: string, analysisContext?: string) {
    'use server'

    // 1. Fetch current party state
    const { data: party, error: fetchError } = await supabase
        .from('parties')
        .select('*')
        .eq('id', partyId)
        .single()

    if (fetchError || !party) {
        throw new Error('Failed to fetch party')
    }

    const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .in('guest_id', (await supabase.from('guests').select('id').eq('party_id', partyId)).data?.map(g => g.id) || [])

    // 2. Call AI to adjust
    const { generateObject } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')
    const { z } = await import('zod')

    const schema = z.object({
        victim: z.object({
            name: z.string(),
            role: z.string(),
            causeOfDeath: z.string(),
            timeOfDeath: z.string(),
            location: z.string(),
            backstory: z.string(),
        }),
        characters: z.array(z.object({
            id: z.string(), // Keep ID to map back
            name: z.string(),
            role: z.string(),
            backstory: z.string(),
            secret_objective: z.string(),
            opening_action: z.string(),
            quirks: z.array(z.string()),
            relationships: z.array(z.object({
                character: z.string(),
                relationship: z.string()
            }))
        })),
        physicalClues: z.array(z.object({
            description: z.string(),
            setupInstruction: z.string(),
            content: z.string(),
            timing: z.enum(['pre-dinner', 'post-murder']),
            relatedTo: z.array(z.string())
        }))
    })

    let fullPrompt = `USER INSTRUCTION: "${instruction}"`
    if (analysisContext) {
        fullPrompt += `\n\nCONTEXT FROM PREVIOUS ANALYSIS (Use this to guide your changes):\n${analysisContext}`
    }

    const systemPrompt = `You are an expert murder mystery editor.
    Your task is to MODIFY the existing mystery based on the user's instruction.
    
    CRITICAL: You must return the EXACT same character IDs so we can update them.
    
    Current Story:
    Title: ${party.name}
    Theme: ${party.story_theme}
    Victim: ${JSON.stringify(party.victim)}
    Characters: ${JSON.stringify(characters?.map(c => ({ id: c.id, name: c.name, role: c.role })))}
    
    ${fullPrompt}
    
    Rewrite the necessary parts of the victim, characters, and clues to satisfy the instruction.
    Keep unchanged parts consistent.
    Return the full updated objects.`

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema,
        prompt: systemPrompt,
    })

    // 3. Update DB
    // Update Party (Victim + Clues)
    await supabase
        .from('parties')
        .update({
            victim: object.victim,
            physical_clues: object.physicalClues
        })
        .eq('id', partyId)

    // Update Characters (Loop)
    for (const char of object.characters) {
        await supabase
            .from('characters')
            .update({
                name: char.name,
                role: char.role,
                backstory: char.backstory,
                secret_objective: char.secret_objective,
                opening_action: char.opening_action,
                quirks: char.quirks,
                relationships: char.relationships
            })
            .eq('id', char.id)
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/host/${partyId}/review`, 'page')
}

export async function regenerateAllPortraits(partyId: string) {
    'use server'

    const { data: guests } = await supabase
        .from('guests')
        .select('id')
        .eq('party_id', partyId)

    if (!guests) return

    const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .in('guest_id', guests.map(g => g.id))

    if (!characters) return

    const OpenAI = (await import('openai')).default
    const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    await Promise.all(characters.map(async (char) => {
        try {
            const response = await openaiClient.images.generate({
                model: "dall-e-3",
                prompt: `A digital painting of a murder mystery character: ${char.name}, ${char.role}. ${char.backstory.slice(0, 100)}... Style: Oil painting, mysterious, noir.`,
                size: "1024x1024",
                quality: "standard",
                n: 1,
                response_format: "b64_json"
            })

            if (!response.data) throw new Error('No image data received')
            const imageBase64 = response.data[0].b64_json
            if (!imageBase64) throw new Error('No image data')

            // Upload to Supabase Storage
            const fileName = `${partyId}/${char.id}-${Date.now()}.png`
            const buffer = Buffer.from(imageBase64, 'base64')

            const { error: uploadError } = await supabase.storage
                .from('portraits')
                .upload(fileName, buffer, {
                    contentType: 'image/png',
                    upsert: true
                })

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('portraits')
                    .getPublicUrl(fileName)

                await supabase
                    .from('characters')
                    .update({ portrait_url: publicUrl })
                    .eq('id', char.id)
            }
        } catch (e) {
            console.error(`Failed to gen portrait for ${char.name}`, e)
        }
    }))

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/host/${partyId}/review`, 'page')
}

export async function unlockClueCode(formData: FormData) {
    'use server'

    const partyId = formData.get('partyId') as string
    const guestId = formData.get('guestId') as string
    const code = formData.get('code') as string

    if (!partyId || !guestId || !code) {
        return { success: false, message: 'Missing required fields' }
    }

    // 1. Find matching code
    const { data: clueCode } = await supabase
        .from('physical_clue_codes')
        .select('*')
        .eq('party_id', partyId)
        .eq('unlock_code', code)
        .single()

    if (!clueCode) {
        return { success: false, message: 'Invalid code' }
    }

    // 2. Check if already unlocked by this guest
    const { data: existing } = await supabase
        .from('clue_unlocks')
        .select('*')
        .eq('clue_code_id', clueCode.id)
        .eq('unlocked_by_guest_id', guestId)
        .single()

    if (existing) {
        return { success: true, alreadyUnlocked: true, content: clueCode.unlocked_content }
    }

    // 3. Record unlock
    await supabase.from('clue_unlocks').insert({
        party_id: partyId,
        clue_code_id: clueCode.id,
        unlocked_by_guest_id: guestId
    })

    // 4. Send the content as a game event
    const content = clueCode.unlocked_content
    const messageContent = `[UNLOCKED CLUE] ${content.content}`

    // If broadcast, send to all. If not, send ONLY to this guest.
    const targetGuestIds = clueCode.broadcast_to_all ? null : [guestId]

    await supabase
        .from('game_events')
        .insert([
            {
                party_id: partyId,
                event_type: 'clue',
                content: messageContent,
                trigger_time: new Date().toISOString(),
                target_guest_ids: targetGuestIds,
            }
        ])

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/party/${partyId}/guest/${guestId}`)

    return { success: true, content: clueCode.unlocked_content }
}

export async function analyzeVenue(formData: FormData) {
    'use server'

    const partyId = formData.get('partyId') as string
    const files = formData.getAll('file') as File[]

    if (!partyId || files.length === 0) throw new Error('Missing partyId or files')

    // 1. Upload ALL images to Supabase
    const uploadedUrls: string[] = []

    for (const file of files) {
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const fileName = `${partyId}/venue-${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage
            .from('venue_images')
            .upload(fileName, fileBuffer, {
                upsert: true,
                contentType: file.type
            })

        let bucket = 'venue_images'
        if (uploadError) {
            console.error('Upload error (venue_images), trying portraits:', uploadError)
            const { error: retryError } = await supabase.storage
                .from('portraits')
                .upload(fileName, fileBuffer, {
                    upsert: true,
                    contentType: file.type
                })

            if (retryError) {
                console.error('Failed to upload image:', file.name, retryError)
                continue // Skip this file
            }
            bucket = 'portraits'
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
        uploadedUrls.push(data.publicUrl)
    }

    if (uploadedUrls.length === 0) throw new Error('No images uploaded successfully')

    // 2. Analyze with GPT-4o Vision (Send ALL images)
    const { generateObject } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')
    const { z } = await import('zod')

    const schema = z.object({
        roomType: z.string(),
        keyObjects: z.array(z.object({
            name: z.string().describe('Object name (e.g., "Red Leather Armchair")'),
            location: z.string().describe('Where in room (e.g., "North wall, left of window")'),
            hidingPotential: z.enum(['high', 'medium', 'low']).describe('How good for hiding clues'),
            clueTypes: z.array(z.string()).describe('What could be hidden here (letter, weapon, photo, etc.)')
        })).describe('List of distinct objects suitable for hiding clues'),
        atmosphere: z.string().describe('The mood of the room (e.g., "Cozy", "Modern", "Spooky")'),
        lightingSuggestion: z.string().describe('How to adjust lighting for a mystery'),
        musicSuggestion: z.string().describe('Genre of music that fits the room'),
        hidingSpots: z.array(z.object({
            object: z.string(),
            specificLocation: z.string().describe('Exact spot (e.g., "Under cushion", "Behind books")'),
            description: z.string(),
            difficulty: z.enum(['easy', 'medium', 'hard']),
            accessibility: z.string().describe('Who can reach it easily'),
            suggestedClueTypes: z.array(z.string())
        })),
        detectableProps: z.array(z.object({
            item: z.string(),
            potential: z.string().describe('How this could be used in mystery')
        })).optional().describe('Any specific props or interesting items found in the images')
    })

    const content: any[] = [
        {
            type: 'text',
            text: `Analyze these images of a party venue for a murder mystery. 
            
            CRITICAL REQUIREMENTS:
            1. Identify EVERY distinct object that could hide a clue (furniture, decorations, appliances, etc.)
            2. For each object, describe SPECIFIC hiding locations (not just "bookshelf" but "bookshelf, behind books on middle shelf")
            3. Categorize by difficulty (easy = obvious spots, hard = clever hiding places)
            4. Suggest what TYPE of clue fits each spot (paper clue, small object, weapon, etc.)
            5. Detect any existing props or themed items visible in images
            
            Think like a mystery game designer - where would YOU hide clues in this space?`
        }
    ]

    uploadedUrls.forEach(url => {
        content.push({ type: 'image', image: url })
    })

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema,
        messages: [
            {
                role: 'user',
                content
            }
        ]
    })

    // 3. Save to DB
    const { data: party } = await supabase.from('parties').select('venue_images').eq('id', partyId).single()
    const currentImages = party?.venue_images || []

    // Generate descriptions for auto-population
    const venueDescription = `A ${object.atmosphere} ${object.roomType}. Key features: ${object.keyObjects.map(o => o.name).join(', ')}.`
    const availableProps = object.detectableProps?.map(p => p.item).join(', ') || ''

    await supabase
        .from('parties')
        .update({
            venue_analysis: object,
            venue_images: [...currentImages, ...uploadedUrls],
            setting_description: venueDescription,
            available_props: availableProps
        })
        .eq('id', partyId)

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/host/${partyId}/dashboard`)

    return object
}
