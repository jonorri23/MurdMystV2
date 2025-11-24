import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner'
import { NotificationListener } from '@/components/NotificationListener'
import { ClueCodeEntry } from '@/components/ClueCodeEntry';

export default async function GuestDashboard({ params }: { params: Promise<{ id: string; guestId: string }> }) {
    const { id, guestId } = await params;

    console.log('=== GUEST PAGE DEBUG ===');
    console.log('Party ID:', id);
    console.log('Guest ID:', guestId);

    const { data: guest } = await supabase
        .from('guests')
        .select('*, parties(name, status)')
        .eq('id', guestId)
        .single();

    console.log('Guest data:', guest);

    if (!guest) {
        console.log('ERROR: Guest not found!');
        notFound();
    }

    const party = guest.parties as unknown as { name: string, status: string };
    console.log('Party status:', party.status);

    // Try character query with detailed debugging
    const characterQuery = await supabase
        .from('characters')
        .select('*')
        .eq('guest_id', guestId)
        .single();

    console.log('Character query result:', characterQuery);
    console.log('Character data:', characterQuery.data);
    console.log('Character error:', characterQuery.error);

    const character = characterQuery.data;

    const { data: allEvents } = await supabase
        .from('game_events')
        .select('*')
        .eq('party_id', id)
        .order('created_at', { ascending: false })

    // Filter events to only show those targeted to this guest (or all guests)
    const events = allEvents?.filter((event: any) => {
        if (!event.target_guest_ids) return true // Broadcast to all
        return event.target_guest_ids.includes(guestId) // Targeted to this guest
    })

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-20">
            <Toaster />
            <NotificationListener partyId={id} guestId={guestId} />

            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        {party.name}
                    </h1>
                    <p className="text-slate-400 text-sm">Welcome, {guest.name}</p>
                </div>
                <div className={`px-3 py-1 text-xs rounded-full border ${party.status === 'active'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                    {party.status === 'planning' ? 'Waiting for Host' : 'Game Active'}
                </div>
            </header>

            <main className="space-y-6">
                {!character ? (
                    /* Waiting State */
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-center space-y-4 animate-pulse">
                        <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-4xl">
                            ?
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-200">Role Pending</h2>
                            <p className="text-slate-400 text-sm mt-2">
                                The host is currently planning the mystery. Your character role will be revealed soon.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Character Card */
                    <div className="space-y-6">
                        {/* How to Play Section */}
                        <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 border border-purple-800/50 rounded-xl p-6">
                            <h2 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                                <span>🎭</span> How to Play
                            </h2>
                            <div className="space-y-2 text-sm text-slate-300">
                                <p>• <strong>Stay in character</strong> - Use your quirks and personality</p>
                                <p>• <strong>Complete your opening action</strong> - This kicks off the mystery!</p>
                                <p>• <strong>Interact with others</strong> - Ask questions, share info, form alliances</p>
                                <p>• <strong>Use your relationships</strong> - They're key to the story</p>
                                <p>• <strong>Watch for clues</strong> - Physical clues around the venue + in-app messages</p>
                            </div>
                        </div>

                        {/* Character Card */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-900/50 to-slate-900 p-6 border-b border-slate-800">
                                <h2 className="text-2xl font-bold text-white">{character.name}</h2>
                                <p className="text-purple-300 font-medium">{character.role}</p>
                            </div>

                            {character.portrait_url && (
                                <div className="p-6 border-b border-slate-800">
                                    <img
                                        src={character.portrait_url}
                                        alt={character.name}
                                        className="w-full max-w-sm mx-auto rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="p-6 space-y-6">
                                {/* Opening Action - Highlighted */}
                                {character.opening_action && (
                                    <div className="bg-yellow-950/30 border-l-4 border-yellow-600 rounded-r-lg p-4">
                                        <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-2">
                                            ⚡ Your Opening Action
                                        </h3>
                                        <p className="text-yellow-100 font-medium">{character.opening_action}</p>
                                        <p className="text-xs text-yellow-600 mt-2">Do this to kickstart the mystery!</p>
                                    </div>
                                )}

                                {/* Backstory */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                        Your Story
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed">{character.backstory}</p>
                                </div>

                                {/* Relationships */}
                                {character.relationships && (character.relationships as any[]).length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                                            🔗 Your Relationships
                                        </h3>
                                        <div className="space-y-2">
                                            {(character.relationships as any[]).map((rel: any, idx: number) => (
                                                <div key={idx} className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                                                    <span className="text-purple-400 font-medium">{rel.character}</span>
                                                    <p className="text-slate-300 text-sm mt-1">{rel.relationship}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quirks & Props */}
                                {character.quirks && (character.quirks as any[]).length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                                            ✨ Your Quirks & Props
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {(character.quirks as any[]).map((quirk: string, idx: number) => (
                                                <span key={idx} className="bg-purple-900/30 text-purple-300 px-3 py-1.5 rounded-full text-sm border border-purple-800/50">
                                                    {quirk}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Secret Objective */}
                                <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">
                                        🔒 Secret Objective
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed">{character.secret_objective}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Physical Clue Unlock */}
                <ClueCodeEntry partyId={id} guestId={guestId} />

                {/* Status Updates / Clues Feed */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Latest Clues</h3>
                    {events && events.length > 0 ? (
                        <div className="space-y-3">
                            {events.map((event: any) => (
                                <div key={event.id} className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 border-l-4 border-l-purple-500">
                                    <p className="text-slate-200 text-sm">{event.content}</p>
                                    <span className="text-xs text-slate-500 mt-2 block">
                                        {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800/50 text-center">
                            <div className="text-sm text-slate-500 py-4">
                                No clues revealed yet.
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
