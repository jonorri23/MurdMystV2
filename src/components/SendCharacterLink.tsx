'use client'

import { useState } from 'react'
import { sendCharacterLink } from '@/app/actions'
import { toast } from 'sonner'

export function SendCharacterLink({ guestId, characterName }: { guestId: string, characterName: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [sending, setSending] = useState(false)

    const handleSend = async () => {
        if (!phoneNumber.trim()) {
            toast.error('Please enter a phone number')
            return
        }

        setSending(true)
        try {
            await sendCharacterLink(guestId, phoneNumber)
            toast.success('Character link sent via SMS!')
            setIsOpen(false)
            setPhoneNumber('')
        } catch (error: any) {
            toast.error(error.message || 'Failed to send SMS')
        }
        setSending(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
            >
                📱 Send Link
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">Send Character Link</h3>
                <p className="text-slate-400 text-sm mb-4">
                    Send a direct link to {characterName}'s character page via SMS.
                </p>
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded font-medium text-sm"
                    >
                        {sending ? 'Sending...' : 'Send SMS'}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        disabled={sending}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
