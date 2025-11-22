import { supabase } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import { ReviewContent } from '@/components/ReviewContent'
import { revalidatePath } from 'next/cache'

async function confirmAndStartGame(partyId: string) {
    'use server'
    await supabase
        .from('parties')
        .update({ status: 'active' })
        .eq('id', partyId)

    redirect(`/host/${partyId}/dashboard`)
}

async function refreshPage(partyId: string) {
    'use server'
    revalidatePath(`/host/${partyId}/review`)
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const { data: party } = await supabase
        .from('parties')
        .select('*')
        .eq('id', id)
        .single()

    if (!party || party.status !== 'reviewing') {
        notFound()
    }

    const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .in('guest_id', (await supabase.from('guests').select('id').eq('party_id', id)).data?.map(g => g.id) || [])

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-24">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 border border-purple-800/50 rounded-xl p-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Review Your Mystery</h1>
                    <p className="text-slate-300">Review and edit the generated content before starting the game.</p>
                </div>

                {/* Review Content - Client Component */}
                <ReviewContent
                    party={party}
                    characters={characters || []}
                    onRefresh={async () => {
                        'use server'
                        await refreshPage(id)
                    }}
                />

                {/* Confirm Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                    <form action={async () => {
                        'use server'
                        await confirmAndStartGame(id)
                    }} className="max-w-6xl mx-auto">
                        <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700">
                            ✓ Confirm & Start Game
                        </button>
                        <p className="text-center text-slate-500 text-sm mt-2">
                            This will activate the game and reveal roles to guests.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
