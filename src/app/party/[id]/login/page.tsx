import { loginGuest } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function GuestLoginPage({ params }: { params: Promise<{ id: string }> }) {
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
                        {party.name}
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Enter your PIN to view your character.
                    </p>
                </div>

                <form action={loginGuest} className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl">
                    <input type="hidden" name="partyId" value={id} />

                    <div className="space-y-2">
                        <label htmlFor="accessPin" className="text-sm font-medium text-slate-300">
                            Your PIN
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
                            autoFocus
                            className="w-full h-12 px-4 text-center text-2xl tracking-widest rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600"
                        />
                        <p className="text-xs text-slate-500">
                            Your host provided you with a 4-digit PIN.
                        </p>
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        Enter Party
                    </Button>
                </form>
            </div>
        </div>
    );
}
