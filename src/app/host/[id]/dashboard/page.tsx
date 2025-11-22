import { supabase } from '@/lib/supabase'
import { ClueControl } from '@/components/clue-control'

export default async function HostDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: party } = await supabase
        .from('parties')
        .select('*')
        .eq('id', id)
        .single()

    const { data: guests } = await supabase
        .from('guests')
        .select('*, characters(*)')
        .eq('party_id', id)

    const { data: events } = await supabase
        .from('game_events')
        .select('*')
        .eq('party_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-purple-400">Host Dashboard</h1>
                    <p className="text-slate-400 text-sm">Party ID: {id}</p>
                </div>
                <div className={`px-3 py-1 text-xs rounded-full border ${party.status === 'active'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                    {party.status === 'planning' ? 'Planning Phase' : 'Game Active'}
                </div>
            </header>

            {party.status === 'planning' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Guest Management Card */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">Guest Management ({guests?.length || 0})</h2>

                        {/* Add Guest Form */}
                        <form action={async (formData) => {
                            'use server'
                            const { addGuest } = await import('@/app/actions')
                            await addGuest(formData)
                        }} className="mb-6 p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <input type="hidden" name="partyId" value={id} />
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="Guest Name"
                                    required
                                    className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <input
                                    name="personalityNotes"
                                    type="text"
                                    placeholder="Personality Notes (optional)"
                                    className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                            </div>
                            <button className="w-full py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors">
                                + Add Guest
                            </button>
                        </form>

                        {/* Guest List with PINs */}
                        <div className="space-y-2">
                            {guests?.length === 0 ? (
                                <p className="text-slate-500 text-sm italic text-center py-4">No guests added yet. Add guests above.</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider px-3 pb-2">
                                        <span>Name</span>
                                        <span>PIN</span>
                                        <span>Notes</span>
                                    </div>
                                    {guests?.map((guest: any) => (
                                        <div key={guest.id} className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-md border border-slate-800 items-center">
                                            <span className="text-slate-100 font-medium">{guest.name}</span>
                                            <code className="bg-slate-900 px-2 py-1 rounded text-purple-400 font-mono text-sm">{guest.access_pin}</code>
                                            <span className="text-xs text-slate-500 truncate">{guest.personality_notes || '—'}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-dashed border-slate-800">
                            <p className="text-sm text-slate-400 mb-2">Share this Party ID with guests:</p>
                            <code className="bg-slate-900 px-3 py-2 rounded text-purple-400 font-mono select-all block text-center">{id}</code>
                            <p className="text-xs text-slate-500 mt-2">Guests will use their PIN to log in and see their role.</p>
                        </div>
                    </div>

                    {/* AI Control Center */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <h2 className="text-xl font-semibold mb-4 text-purple-400">AI Director</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Once everyone has joined, generate the mystery. This will assign roles and start the game.
                        </p>
                        <form action={async () => {
                            'use server'
                            const { generateMystery } = await import('@/app/actions')
                            await generateMystery(id)
                        }}>
                            <button
                                disabled={!guests || guests.length < 3}
                                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {guests && guests.length < 3 ? `Need ${3 - guests.length} more guests` : 'Generate Mystery'}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Game Intro */}
                    <div className="bg-gradient-to-r from-purple-900/20 to-slate-900 p-8 rounded-xl border border-purple-500/30">
                        <h2 className="text-3xl font-bold text-white mb-4">{party.name}</h2>
                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-purple-400 uppercase tracking-wider text-sm font-bold mb-2">Read to Guests:</h3>
                            <p className="text-lg leading-relaxed text-slate-200 bg-slate-950/50 p-6 rounded-lg border border-slate-800">
                                {party.setting_description}
                            </p>
                        </div>
                    </div>

                    {/* Game Controls */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <h2 className="text-xl font-semibold mb-4 text-purple-400">Game Master Controls</h2>
                        <form action={async (formData) => {
                            'use server'
                            const { sendClue } = await import('@/app/actions')
                            await sendClue(formData)
                        }}>
                            <input type="hidden" name="partyId" value={id} />
                            <ClueControl partyId={id} guests={guests || []} />
                        </form>
                    </div>

                    {/* Clue History */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <h2 className="text-xl font-semibold mb-4 text-purple-400">Clue Timeline</h2>
                        {events && events.length > 0 ? (
                            <div className="space-y-3">
                                {events.map((event: any) => (
                                    <div key={event.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-slate-200 text-sm flex-1">{event.content}</p>
                                            <span className="text-xs text-slate-500 ml-4 whitespace-nowrap">
                                                {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 flex-wrap">
                                            {event.target_guest_ids ? (
                                                event.target_guest_ids.map((gid: string) => {
                                                    const guest = guests?.find((g: any) => g.id === gid)
                                                    const char = guest?.characters[0]
                                                    return (
                                                        <span key={gid} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full">
                                                            {char?.name || guest?.name || 'Unknown'}
                                                        </span>
                                                    )
                                                })
                                            ) : (
                                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                                                    All Guests
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-4">No clues sent yet.</p>
                        )}
                    </div>

                    {/* Character List */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {guests?.map((guest: any) => {
                            const char = guest.characters[0];
                            if (!char) return null;
                            return (
                                <div key={guest.id} className={`bg-slate-900 p-4 rounded-xl border ${char.secret_objective.includes('MURDERER') ? 'border-red-900/50' : 'border-slate-800'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white">{char.name}</h3>
                                        <span className="text-xs text-slate-500">{guest.name}</span>
                                    </div>
                                    <p className="text-sm text-purple-400 mb-2">{char.role}</p>
                                    <div className="text-xs text-slate-400 bg-slate-950 p-2 rounded">
                                        <span className="font-bold text-slate-300">Secret:</span> {char.secret_objective}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
