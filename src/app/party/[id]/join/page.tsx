import { joinParty } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function JoinPartyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: party } = await supabase
        .from('parties')
        .select('name, status')
        .eq('id', id)
        .single();

    if (!party) {
        notFound();
    }

    // Block joining if game has already started
    if (party.status !== 'planning') {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-8">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">
                            Game Already Started
                        </h1>
                        <p className="text-slate-300 mb-6">
                            This party has already begun. New guests cannot join after the mystery has been generated.
                        </p>
                        <p className="text-sm text-slate-500">
                            Party: <span className="text-purple-400">{party.name}</span>
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Status: <span className="text-yellow-400 capitalize">{party.status}</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Join {party.name}
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Enter your details to join the mystery party!
                    </p>
                </div>

                <form action={joinParty} className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl">
                    <input type="hidden" name="partyId" value={id} />

                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-300">
                            Your Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            autoFocus
                            placeholder="Enter your name"
                            className="w-full h-12 px-4 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="personalityNotes" className="text-sm font-medium text-slate-300">
                            Personality Notes <span className="text-slate-500">(Optional)</span>
                        </label>
                        <textarea
                            id="personalityNotes"
                            name="personalityNotes"
                            rows={3}
                            placeholder="e.g. Loves drama, shy, competitive..."
                            className="w-full p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600 resize-none"
                        />
                        <p className="text-xs text-slate-500">
                            Optional notes to help the AI match you with a fun character role.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-slate-300">
                            Secret Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            required
                            placeholder="1234"
                            className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600"
                        />
                        <p className="text-xs text-slate-500">
                            You'll need this to see your clues later. Keep it safe!
                        </p>
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        Join Party
                    </Button>
                </form>
            </div>
        </div>
    );
}
