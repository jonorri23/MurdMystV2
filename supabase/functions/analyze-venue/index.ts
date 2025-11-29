import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { partyId, imageUrls } = await req.json()

        if (!partyId || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            throw new Error('partyId and imageUrls array are required')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const openaiKey = Deno.env.get('OPENAI_API_KEY')!

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

        imageUrls.forEach((url: string) => {
            content.push({ type: 'image', image: url })
        })

        console.log('Calling OpenAI Vision API...')

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content }],
                response_format: { type: 'json_object' },
                temperature: 0.7,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('OpenAI API Error:', response.status, errorText)
            throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
        }

        const aiResult = await response.json()

        if (aiResult.error) {
            console.error('OpenAI returned error:', aiResult.error)
            throw new Error(`OpenAI Error: ${aiResult.error.message}`)
        }

        if (!aiResult.choices?.[0]?.message) {
            throw new Error('Invalid response from OpenAI')
        }

        let aiResponseContent = aiResult.choices[0].message.content

        if (!aiResponseContent) {
            throw new Error('OpenAI returned empty content')
        }

        // Strip markdown code blocks if present
        if (aiResponseContent.includes('```json')) {
            aiResponseContent = aiResponseContent.replace(/```json\n|\n```/g, '')
        } else if (aiResponseContent.includes('```')) {
            aiResponseContent = aiResponseContent.replace(/```\n|\n```/g, '')
        }

        const analysis = JSON.parse(aiResponseContent)
        console.log('Analysis successful')

        const { data: party } = await supabase.from('parties').select('venue_images').eq('id', partyId).single()
        const currentImages = party?.venue_images || []
        const uniqueImages = [...new Set([...currentImages, ...imageUrls])]

        const venueDescription = `A ${analysis.atmosphere} ${analysis.roomType}. Key features: ${analysis.keyObjects.map((o: any) => o.name).join(', ')}.`

        const { error: updateError } = await supabase
            .from('parties')
            .update({
                venue_analysis: analysis,
                venue_images: uniqueImages,
                setting_description: venueDescription
            })
            .eq('id', partyId)

        if (updateError) {
            throw new Error(`Database error: ${updateError.message}`)
        }

        console.log('Venue analysis completed')

        return new Response(
            JSON.stringify({ success: true, analysis }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
