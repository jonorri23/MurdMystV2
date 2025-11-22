import { loginGuest } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function GuestLoginPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: party } = await supabase
        .from('parties')
        .select('name, status')
        .eq('id', id)
        .single();

    if (!party) {
        notFound();
    }

    // Only allow login when game is active
    if (party.status !== 'active') {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="bg-yellow-950/30 border border-yellow-900/50 rounded-xl p-8">
                        <h1 className="text-2xl font-bold text-yellow-400 mb-4">
                            Game Not Started Yet
                        </h1>
                        <p className="text-slate-300 mb-6">
                            The host is still preparing the mystery. You'll be able to log in once the game starts!
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
                        {party.name}
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Enter your PIN to reveal your role
                    </p>
                </div>

                <form action={loginGuest} className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl">
                    <input type="hidden" name="partyId" value={id} />

                    <div className="space-y-2">
                        <label htmlFor="accessPin" className="text-sm font-medium text-slate-300">
                            Your 4-Digit PIN
                        </label>
                        <input
                            id="accessPin"
                            name="accessPin"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]{4}"
                            maxLength={4}
                            required
                            autoFocus
                            placeholder="••••"
                            className="w-full h-14 px-4 rounded-md bg-slate-950 border border-slate-800 text-slate-100 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            The host provided you with a 4-digit PIN
                        </p>
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12">
                        Enter Game
                    </Button>
                </form>
            </div>
        </div>
    );
}
