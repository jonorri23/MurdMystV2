'use client'

import { useState } from 'react'

export function ClueControl({ partyId, guests }: { partyId: string, guests: any[] }) {
    const [selectedGuests, setSelectedGuests] = useState<string[]>([])
    const [sendToAll, setSendToAll] = useState(true)

    const toggleGuest = (guestId: string) => {
        if (selectedGuests.includes(guestId)) {
            setSelectedGuests(selectedGuests.filter(id => id !== guestId))
        } else {
            setSelectedGuests([...selectedGuests, guestId])
        }
    }

    const toggleAll = () => {
        if (sendToAll) {
            setSendToAll(false)
            setSelectedGuests([])
        } else {
            setSendToAll(true)
            setSelectedGuests([])
        }
    }

    return (
        <div className="space-y-4">
            {/* Recipient Selection */}
            <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Send To:</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    <button
                        type="button"
                        onClick={toggleAll}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${sendToAll
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        All Guests
                    </button>
                    {guests.map((guest) => {
                        const char = guest.characters[0]
                        const isSelected = selectedGuests.includes(guest.id)
                        return (
                            <button
                                key={guest.id}
                                type="button"
                                onClick={() => {
                                    setSendToAll(false)
                                    toggleGuest(guest.id)
                                }}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${isSelected
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {char?.name || guest.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Message Input */}
            <div>
                <input type="hidden" name="targetGuestIds" value={
                    sendToAll ? 'all' : JSON.stringify(selectedGuests)
                } />
                <div className="flex gap-2">
                    <input
                        name="content"
                        type="text"
                        placeholder="Type a clue or announcement..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                    />
                    <button className="bg-purple-600 text-white px-6 py-2 rounded-md font-medium hover:bg-purple-700 transition-colors">
                        Send
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    {sendToAll
                        ? `Sending to all ${guests.length} guests`
                        : `Sending to ${selectedGuests.length} selected guest${selectedGuests.length !== 1 ? 's' : ''}`}
                </p>
            </div>
        </div>
    )
}
