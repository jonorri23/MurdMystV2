import { redirect } from 'next/navigation'

export default async function JoinRedirectPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = await params
    // The Game ID is the Party UUID, so we just redirect to the party login
    redirect(`/party/${gameId}/login`)
}
