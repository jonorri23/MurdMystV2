const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function getGameId() {
    const { data, error } = await supabase
        .from('parties')
        .select('game_id')
        .eq('id', '688a7d64-a0c0-4ce1-964d-c3da59c17d1a')
        .single()

    if (error) console.error(error)
    else console.log('GAME_ID:', data.game_id)
}

getGameId()
