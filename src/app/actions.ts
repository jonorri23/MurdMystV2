'use server'

import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function createParty(formData: FormData) {
    const name = formData.get('name') as string
    const hostPin = formData.get('hostPin') as string
    const venueDescription = formData.get('venueDescription') as string
    const storyTheme = formData.get('storyTheme') as string

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
                setting_description: venueDescription || 'A typical room',
                story_theme: storyTheme || 'A classic murder mystery'
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

    // 2. Call AI
    const prompt = `
    Story/Theme: ${party.story_theme || party.name}
    Physical Venue: ${party.setting_description || 'A typical room'}
    Guests:
    ${guests.map(g => `- ${g.name} (${g.personality_notes || 'No notes'})`).join('\n')}
  `

    const { object } = await generateObject({
        model: openai('gpt-4o'),
        system: SYSTEM_PROMPT,
        prompt: prompt,
        schema: z.object({
            title: z.string(),
            intro: z.string(),
            characters: z.array(z.object({
                guestName: z.string(),
                roleName: z.string(),
                roleDescription: z.string(),
                backstory: z.string(),
                secret: z.string(),
                objective: z.string(),
                isMurderer: z.boolean(),
            })),
            clues: z.array(z.object({
                content: z.string(),
                suggestedTiming: z.string(),
                targetRoles: z.array(z.string()),
            })),
        }),
    })

    // 3. Save to Database
    // Update Party to reviewing status (not active yet!)
    await supabase
        .from('parties')
        .update({
            name: object.title,
            setting_description: object.intro,
            status: 'reviewing' // New status for review phase
        })
        .eq('id', partyId)

    // Create Characters and Generate Portraits
    const characterInserts = await Promise.all(object.characters.map(async char => {
        const guest = guests.find(g => g.name === char.guestName)
        if (!guest) return null

        // Generate portrait using gpt-image-1
        let portraitUrl = null
        try {
            const OpenAI = (await import('openai')).default
            const client = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            })

            const imagePrompt = `A portrait of ${char.roleName}, ${char.roleDescription}. ${party.story_theme || 'Mystery theme'}. Dramatic lighting, detailed face, professional character portrait.`

            const response = await client.images.generate({
                model: 'gpt-image-1',
                prompt: imagePrompt,
                n: 1,
                size: '1024x1024',
            })

            portraitUrl = response.data[0]?.url || null
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
            portrait_url: portraitUrl
        }
    }))

    const validCharacterInserts = characterInserts.filter(Boolean)

    if (validCharacterInserts.length > 0) {
        await supabase
            .from('characters')
            .insert(validCharacterInserts as any)
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

  await supabase
    .from("parties")
    .update({
      story_theme: storyTheme,
      setting_description: venueDescription
    })
    .eq("id", partyId)

  const { revalidatePath } = await import("next/cache")
  revalidatePath(`/host/${partyId}/dashboard`)
}
