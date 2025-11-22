'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function NotificationListener({ partyId, guestId }: { partyId: string, guestId?: string }) {
    const router = useRouter()

    useEffect(() => {
        console.log('🔌 Subscribing to game events for party:', partyId)

        const channel = supabase
            .channel(`game_events:${partyId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_events',
                    filter: `party_id=eq.${partyId}`
                },
                (payload) => {
                    console.log('🔔 New event received:', payload)
                    const event = payload.new

                    // Check if this event is for us
                    // If target_guest_ids is null, it's for everyone
                    // If we are a guest (guestId exists) and our ID is in the list, it's for us
                    // If we are the host (guestId is undefined), we see everything

                    const isForEveryone = !event.target_guest_ids
                    const isForMe = guestId && event.target_guest_ids?.includes(guestId)
                    const isHost = !guestId

                    if (isForEveryone || isForMe || isHost) {
                        // Trigger vibration if available
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([200, 100, 200])
                        }

                        // Play sound (optional, browser policy might block)
                        // const audio = new Audio('/notification.mp3')
                        // audio.play().catch(e => console.log('Audio play failed', e))

                        // Show Toast
                        toast(event.content, {
                            duration: 8000,
                            position: 'top-center',
                            style: {
                                background: '#1e293b', // slate-900
                                color: '#e2e8f0', // slate-200
                                border: '1px solid #7c3aed', // purple-600
                                fontSize: '16px',
                                padding: '16px',
                            },
                            icon: '📩'
                        })

                        // Refresh data
                        router.refresh()
                    }
                }
            )
            .subscribe()

        return () => {
            console.log('🔌 Unsubscribing from game events')
            supabase.removeChannel(channel)
        }
    }, [partyId, guestId, router])

    return null // Headless component
}
