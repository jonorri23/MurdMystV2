'use client'

import { useState } from 'react'
import { sendClue } from '@/app/actions'

export function PhaseControl({ partyId, victimName }: { partyId: string, victimName: string }) {
    const [isLoading, setIsLoading] = useState(false)

    const broadcast = async (message: string) => {
        if (confirm(`Broadcast this message to all guests?\n\n"${message}"`)) {
            setIsLoading(true)
            const formData = new FormData()
            formData.append('partyId', partyId)
            formData.append('content', message)
            // No targetGuestId means broadcast

            await sendClue(formData)
            setIsLoading(false)
        }
    }

    return (
        <div className="grid gap-3 md:grid-cols-3">
            <button
                onClick={() => broadcast("🍽️ DINNER IS SERVED! Please take your seats. Remember to stay in character and complete your opening actions.")}
                disabled={isLoading}
                className="p-4 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 rounded-lg text-left transition-colors"
            >
                <span className="block text-blue-400 font-bold mb-1">1. Start Dinner</span>
                <span className="text-xs text-slate-400">Broadcasts dinner announcement. Encourages opening actions.</span>
            </button>

            <button
                onClick={() => broadcast(`💀 A MURDER HAS OCCURRED! ${victimName} has been found dead! Everyone freeze and check your devices for clues.`)}
                disabled={isLoading}
                className="p-4 bg-red-900/30 hover:bg-red-900/50 border border-red-800 rounded-lg text-left transition-colors"
            >
                <span className="block text-red-400 font-bold mb-1">2. Announce Murder</span>
                <span className="text-xs text-slate-400">Triggers the investigation phase. Reveals the victim.</span>
            </button>

            <button
                onClick={() => broadcast("⚖️ THE TIME HAS COME! Gather round to present your evidence and accuse the killer.")}
                disabled={isLoading}
                className="p-4 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800 rounded-lg text-left transition-colors"
            >
                <span className="block text-purple-400 font-bold mb-1">3. Start Accusations</span>
                <span className="text-xs text-slate-400">Calls everyone together for the final resolution.</span>
            </button>
        </div>
    )
}
