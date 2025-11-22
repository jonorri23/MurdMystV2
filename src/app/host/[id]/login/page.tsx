import { loginHost } from '@/app/actions';
import { Button } from '@/components/ui/button';

export default async function HostLoginPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Host Login
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Enter your Host PIN to manage the party.
                    </p>
                </div>

                <form action={loginHost} className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl">
                    <input type="hidden" name="partyId" value={id} />

                    <div className="space-y-2">
                        <label htmlFor="hostPin" className="text-sm font-medium text-slate-300">
                            Host PIN
                        </label>
                        <input
                            id="hostPin"
                            name="hostPin"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            required
                            placeholder="1234"
                            className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        Access Dashboard
                    </Button>
                </form>
            </div>
        </div>
    );
}
