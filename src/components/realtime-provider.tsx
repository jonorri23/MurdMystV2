'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type RealtimeContextType = {
    isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextType>({
    isConnected: false,
})

export function RealtimeProvider({
    children,
    partyId,
}: {
    children: React.ReactNode
    partyId: string
}) {
    const [isConnected, setIsConnected] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const channel = supabase
            .channel(`party:${partyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_events',
                    filter: `party_id=eq.${partyId}`,
                },
                (payload) => {
                    console.log('Game Event received:', payload)
                    // Refresh the current route to fetch new data
                    router.refresh()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'parties',
                    filter: `id=eq.${partyId}`,
                },
                (payload) => {
                    console.log('Party update received:', payload)
                    router.refresh()
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partyId, router])

    return (
        <RealtimeContext.Provider value={{ isConnected }}>
            {children}
        </RealtimeContext.Provider>
    )
}

export const useRealtime = () => useContext(RealtimeContext)
