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
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                        MurdMyst
                    </h1>
                    <p className="text-slate-400">
                        Enter the Game ID to join
                    </p>
                </div>

                <form action={async (formData: FormData) => {
                    'use server'
                    const partyId = formData.get('partyId') as string
                    redirect(`/party/${partyId}/login`)
                }} className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl">
                    <div className="space-y-2">
                        <label htmlFor="partyId" className="text-sm font-medium text-slate-300">
                            Game ID
                        </label>
                        <input
                            id="partyId"
                            name="partyId"
                            type="text"
                            required
                            autoFocus
                            placeholder="Enter Game ID"
                            className="w-full h-12 px-4 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            The host will provide you with a Game ID
                        </p>
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12">
                        Continue →
                    </Button>
                </form>
            </div>
        </div>
    );
}
