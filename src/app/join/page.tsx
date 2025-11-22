import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

async function findParty(formData: FormData) {
    'use server'
    const partyId = formData.get('partyId') as string
    if (partyId) {
        redirect(`/party/${partyId}/join`)
    }
}

export default function JoinPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Find a Party
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Enter the Party ID shared by your host.
                    </p>
                </div>

                <form action={findParty} className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl">
                    <div className="space-y-2">
                        <label htmlFor="partyId" className="text-sm font-medium text-slate-300">
                            Party ID
                        </label>
                        <input
                            id="partyId"
                            name="partyId"
                            type="text"
                            required
                            placeholder="e.g. 123e4567-e89b..."
                            className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                        Find Party
                    </Button>
                </form>
            </div>
        </div>
    );
}
