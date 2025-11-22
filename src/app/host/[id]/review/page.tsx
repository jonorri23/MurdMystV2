import { supabase } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'

async function confirmAndStartGame(partyId: string) {
    'use server'
    await supabase
        .from('parties')
        .update({ status: 'active' })
        .eq('id', partyId)

    redirect(`/host/${partyId}/dashboard`)
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
        .eq('guest_id', { in: (await supabase.from('guests').select('id').eq('party_id', id)).data?.map(g => g.id) || [] })

    const { data: events } = await supabase
        .from('game_events')
        .select('*')
        .eq('party_id', id)
        .order('created_at', { ascending: true })

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-24">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 border border-purple-800/50 rounded-xl p-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Review Your Mystery</h1>
                    <p className="text-slate-300">Review the generated content before starting the game.</p>
                </div>

                {/* Victim Information */}
                {party.victim && (
                    <div className="bg-slate-900 border border-red-900/50 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                            <span>💀</span> The Murder
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">{(party.victim as any).name}</h3>
                                <p className="text-slate-400 text-sm mb-1">{(party.victim as any).role}</p>
                                <div className="mt-4 space-y-2 text-sm">
                                    <p className="text-slate-300">
                                        <span className="text-red-400 font-medium">Cause:</span> {(party.victim as any).causeOfDeath}
                                    </p>
                                    <p className="text-slate-300">
                                        <span className="text-red-400 font-medium">Time:</span> {(party.victim as any).timeOfDeath}
                                    </p>
                                    <p className="text-slate-300">
                                        <span className="text-red-400 font-medium">Location:</span> {(party.victim as any).location}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Backstory</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">{(party.victim as any).backstory}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Physical Clue Checklist */}
                {party.physical_clues && (party.physical_clues as any[]).length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                            <span>🔍</span> Physical Clue Setup
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Set up these physical clues BEFORE the game starts.
                        </p>
                        <div className="space-y-3">
                            {(party.physical_clues as any[]).map((clue: any, idx: number) => (
                                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${clue.timing === 'pre-dinner'
                                                ? 'bg-blue-900/30 text-blue-400'
                                                : 'bg-orange-900/30 text-orange-400'
                                            }`}>
                                            {clue.timing === 'pre-dinner' ? 'Pre-Dinner' : 'Post-Murder'}
                                        </span>
                                        <h3 className="text-white font-medium">{clue.description}</h3>
                                    </div>
                                    <p className="text-purple-400 text-sm font-medium mb-2">
                                        📍 {clue.setupInstruction}
                                    </p>
                                    <p className="text-slate-400 text-sm italic">"{clue.content}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Character Roles */}
                {characters && characters.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-purple-400 mb-6">Character Roles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {characters.map((char: any) => (
                                <div key={char.id} className={`bg-slate-950 border rounded-lg p-5 ${char.secret_objective?.includes('MURDERER')
                                        ? 'border-red-900/50'
                                        : 'border-slate-800'
                                    }`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{char.name}</h3>
                                            <p className="text-slate-400 text-sm">{char.role}</p>
                                        </div>
                                        {char.secret_objective?.includes('MURDERER') && (
                                            <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs font-medium">
                                                Murderer
                                            </span>
                                        )}
                                    </div>

                                    {char.opening_action && (
                                        <div className="bg-yellow-950/20 border-l-2 border-yellow-600 rounded-r px-3 py-2 mb-3">
                                            <p className="text-xs text-yellow-500 font-semibold uppercase">Opening Action</p>
                                            <p className="text-yellow-200 text-sm mt-1">{char.opening_action}</p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Backstory</h4>
                                            <p className="text-slate-300 text-sm">{char.backstory}</p>
                                        </div>

                                        <div className="bg-red-950/20 border border-red-900/30 rounded p-3">
                                            <h4 className="text-xs font-semibold text-red-500 uppercase mb-1">Secret Objective</h4>
                                            <p className="text-red-200 text-sm">{char.secret_objective}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
