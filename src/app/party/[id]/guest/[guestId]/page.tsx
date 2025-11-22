import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function GuestDashboard({ params }: { params: Promise<{ id: string; guestId: string }> }) {
    const { id, guestId } = await params;

    const { data: guest } = await supabase
        .from('guests')
        .select('*, parties(name, status)')
        .eq('id', guestId)
        .single();

    if (!guest) {
        notFound();
    }

    const party = guest.parties as unknown as { name: string, status: string };

    const { data: character } = await supabase
        .from('characters')
        .select('*')
        .eq('guest_id', guestId)
        .single();

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
                        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-900/50 to-slate-900 p-6 border-b border-slate-800">
                                <h2 className="text-2xl font-bold text-white">{character.name}</h2>
                                <p className="text-purple-300 font-medium">{character.role}</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Your Backstory</h3>
                                    <p className="text-slate-300 leading-relaxed text-sm">
                                        {character.backstory}
                                    </p>
                                </div>

                                <div className="bg-red-950/30 p-4 rounded-lg border border-red-900/30">
                                    <h3 className="text-sm font-medium text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        Secret Objective
                                    </h3>
                                    <p className="text-red-200 text-sm font-medium">
                                        {character.secret_objective}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
