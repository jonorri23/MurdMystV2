import { joinParty } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function JoinPartyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: party } = await supabase
        .from('parties')
        .select('name')
        .eq('id', id)
        .single();

    if (!party) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Join {party.name}
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Join the party! You'll be assigned a random character role fitting the mystery theme.
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
                            placeholder="John Doe"
                            className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="personality" className="text-sm font-medium text-slate-300">
                            Personality Notes <span className="text-slate-500 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            id="personality"
                            name="personality"
                            rows={4}
                            placeholder="e.g. I'm outgoing, love drama..."
                            className="w-full p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600 resize-none"
                        />
                        <p className="text-xs text-slate-500">
                            Add notes if you want a specific vibe, otherwise the AI will randomize your role based on the party theme.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="accessPin" className="text-sm font-medium text-slate-300">
                            Secret Access PIN
                        </label>
                        <input
                            id="accessPin"
                            name="accessPin"
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
