import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function JoinRedirectPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = await params

    // Lookup party by game_id
    const { data: party } = await supabase
        .from('parties')
        .select('id')
        .eq('game_id', gameId.toUpperCase())
        .single()

    if (party) {
        redirect(`/party/${party.id}/login`)
    }

    // If not found, redirect to main join page with error (or just main join page for now)
    redirect('/join?error=invalid_code')
}
