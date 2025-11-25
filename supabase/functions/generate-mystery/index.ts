import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

        const systemPrompt = `You are an expert murder mystery writer creating interactive party games.
You must create a complete, immersive mystery tailored to the exact number of guests, venue, and theme provided.

CRITICAL RULES:
- Create EXACTLY one character role for each guest (no more, no less)
- ONE character must be the murderer
- The victim is NOT a guest character (separate entity)
- Use venue analysis details for physical clue placement
- Ensure multiple solution paths based on complexity setting
- Make relationships between characters dramatic and interconnected`

        const venueContext = party.venue_analysis
            ? `\n\nVENUE ANALYSIS: ${JSON.stringify(party.venue_analysis)}`
            : ''

        const userPrompt = `Story Theme: ${party.story_theme || 'Classic murder mystery'}
Physical Venue: ${party.setting_description || 'A typical room'}${venueContext}
Target Duration: ${party.target_duration || '60-90 minutes'}
Complexity: ${party.complexity || 'balanced'}
Minimum Solution Paths: ${party.min_solution_paths || 2}

Guests (${guests.length}):
${guests.map(g => `- ${g.name}${g.personality_notes ? ` (${g.personality_notes})` : ''}`).join('\n')}

Generate a complete murder mystery with:
1. A victim (NOT a guest) with full backstory
2. Character roles for ALL ${guests.length} guests with relationships, secrets, and dramatic opening actions
3. Physical clues with specific venue-based setup instructions
4. In-app clues for progressive revelation
5. Complete solution with multiple paths`

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.8,
            }),
        })

        const aiResult = await response.json()
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

        // Create characters
        for (let i = 0; i < mysteryData.characters.length; i++) {
            const char = mysteryData.characters[i]
            const guest = guests[i] // Match by index for now

            if (guest) {
                await supabase.from('characters').insert({
                    guest_id: guest.id,
                    name: char.roleName,
                    role: char.roleDescription,
                    backstory: char.backstory,
                    secret_objective: char.objective + (char.isMurderer ? " YOU ARE THE MURDERER." : ""),
                    relationships: char.relationships || [],
                    quirks: char.quirks || [],
                    opening_action: char.openingAction || null
                })
            }
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
