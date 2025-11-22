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

    const { data: guests } = await supabase
        .from('guests')
        .select('*, characters(*)')
        .eq('party_id', id)

    const { data: events } = await supabase
        .from('game_events')
        .select('*')
        .eq('party_id', id)
        .order('created_at', { ascending: true })

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-20">
            <header className="mb-8">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                            Review & Edit Mystery
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">{party.name}</p>
                    </div>
                    <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                        Reviewing
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="font-semibold text-purple-400 mb-2">Setting the Scene:</h2>
                    <p className="text-slate-300 text-sm leading-relaxed">{party.setting_description}</p>
                </div>
            </header>

            {/* Characters */}
            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Character Roles</h2>
                <p className="text-slate-400 text-sm mb-6">Review the generated roles. You can manually edit these later in the database if needed.</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {guests?.map((guest: any) => {
                        const char = guest.characters[0]
                        if (!char) return null
                        const isMurderer = char.secret_objective.includes('MURDERER')
                        return (
                            <div
                                key={guest.id}
                                className={`bg-slate-900 p-5 rounded-xl border ${isMurderer ? 'border-red-900/50 bg-red-950/10' : 'border-slate-800'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{char.name}</h3>
                                        <p className="text-sm text-purple-400">{char.role}</p>
                                    </div>
                                    <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded">{guest.name}</span>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-slate-400 font-medium mb-1">Backstory:</p>
                                        <p className="text-slate-300 leading-relaxed">{char.backstory}</p>
                                    </div>

                                    <div className={`p-3 rounded-lg ${isMurderer ? 'bg-red-950/30 border border-red-900/30' : 'bg-slate-950 border border-slate-800'}`}>
                                        <p className={`font-medium mb-1 ${isMurderer ? 'text-red-400' : 'text-slate-400'}`}>
                                            {isMurderer ? '🔪 Secret & Objective:' : 'Objective:'}
                                        </p>
                                        <p className={isMurderer ? 'text-red-200 font-medium' : 'text-slate-300'}>
                                            {char.secret_objective}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Clues */}
            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Pre-generated Clues</h2>
                <p className="text-slate-400 text-sm mb-6">
                    These clues were generated by the AI. You can send them as-is or create custom clues during the game.
                </p>
                <div className="space-y-3">
                    {events && events.length > 0 ? (
                        events.map((event: any, index: number) => (
                            <div key={event.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                                <div className="flex items-start gap-4">
                                    <span className="text-2xl font-bold text-purple-600 opacity-50">#{index + 1}</span>
                                    <div className="flex-1">
                                        <p className="text-slate-200 mb-2">{event.content}</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {event.target_guest_ids ? (
                                                event.target_guest_ids.map((gid: string) => {
                                                    const guest = guests?.find((g: any) => g.id === gid)
                                                    const char = guest?.characters[0]
                                                    return (
                                                        <span key={gid} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full">
                                                            → {char?.name || guest?.name || 'Unknown'}
                                                        </span>
                                                    )
                                                })
                                            ) : (
                                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
                                                    → All Guests
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-8">No clues generated.</p>
                    )}
                </div>
            </section>

            {/* Confirm Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                <form action={async () => {
                    'use server'
                    await confirmAndStartGame(id)
                }} className="max-w-4xl mx-auto">
                    <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20">
                        ✓ Confirm & Start Game
                    </button>
                    <p className="text-center text-slate-500 text-sm mt-2">
                        This will activate the game and reveal roles to guests.
                    </p>
                </form>
            </div>
        </div>
    )
}
