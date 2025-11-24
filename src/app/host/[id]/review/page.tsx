import { estimateGameDuration } from '@/lib/game-duration-estimator'
import { supabase } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import { ReviewContent } from '@/components/ReviewContent'
import { revalidatePath } from 'next/cache'

async function confirmAndStartGame(partyId: string) {
    'use server'
    await supabase
        .from('parties')
        .update({ status: 'active' })
        .eq('id', partyId)

    redirect(`/host/${partyId}/dashboard`)
}

async function refreshPage(partyId: string) {
    'use server'
    revalidatePath(`/host/${partyId}/review`)
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const { data: party } = await supabase
        .from('parties')
        .select('*')
        .eq('id', id)
        .single()

    if (!party || party.status !== 'reviewing') {
        notFound()
    }

    const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .in('guest_id', (await supabase.from('guests').select('id').eq('party_id', id)).data?.map(g => g.id) || [])

    // Fetch in-app clues for duration estimation
    const { data: inAppClues } = await supabase
        .from('game_events')
        .select('*')
        .eq('party_id', id)
        .eq('event_type', 'clue')

    // Construct mystery object for estimator
    const mysteryForEstimation = {
        physicalClues: party.physical_clues || [],
        clues: inAppClues || [],
        solutionMetadata: party.solution_metadata,
        // Other fields not needed for estimation
        title: party.name,
        intro: party.intro,
        victim: party.victim,
        characters: characters || []
    }

    const duration = estimateGameDuration(mysteryForEstimation as any, characters?.length || 0)

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-24">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 border border-purple-800/50 rounded-xl p-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Review Your Mystery</h1>
                    <p className="text-slate-300">Review and edit the generated content before starting the game.</p>
                </div>

                {/* Duration Estimate */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                            <span>⏱️</span> Estimated Duration
                        </h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-white">{duration.typicalTime}</span>
                            <span className="text-slate-400">minutes</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Range: {duration.minimumTime}-{duration.maximumTime} min • Based on {characters?.length} players & {mysteryForEstimation.physicalClues.length + mysteryForEstimation.clues.length} clues
                        </p>
                    </div>

                    <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 text-sm space-y-1 min-w-[200px]">
                        <div className="flex justify-between text-slate-400">
                            <span>Intro & Roles:</span>
                            <span className="text-slate-200">{duration.breakdown.introAndRoleReading}m</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Investigation:</span>
                            <span className="text-slate-200">{duration.breakdown.investigation}m</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Clue Discovery:</span>
                            <span className="text-slate-200">{duration.breakdown.clueDiscovery}m</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Reveal:</span>
                            <span className="text-slate-200">{duration.breakdown.accusationAndReveal}m</span>
                        </div>
                    </div>
                </div>

                {/* Review Content - Client Component */}
                <ReviewContent
                    party={party}
                    characters={characters || []}
                    onRefresh={async () => {
                        'use server'
                        await refreshPage(id)
                    }}
                />

                {/* Confirm Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                    <form action={async () => {
                        'use server'
                        await confirmAndStartGame(id)
                    }} className="max-w-6xl mx-auto">
                        <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700">
                            ✓ Confirm & Start Game
                        </button>
                        <p className="text-center text-slate-500 text-sm mt-2">
                            This will activate the game and reveal roles to guests.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
