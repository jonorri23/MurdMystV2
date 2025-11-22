'use client'

import { EditableCharacter } from '@/components/EditableCharacter'
import { EditableClue } from '@/components/EditableClue'
import { adjustStory } from '@/app/actions'
import { useState } from 'react'

export function ReviewContent({
    party,
    characters,
    onRefresh
}: {
    party: any
    characters: any[]
    onRefresh: () => void
}) {
    const [isCheckingStory, setIsCheckingStory] = useState(false)
    const [storyCheckResult, setStoryCheckResult] = useState<string | null>(null)
    const [isAdjusting, setIsAdjusting] = useState(false)
    const [adjustmentPrompt, setAdjustmentPrompt] = useState('')

    const checkStoryCoherence = async () => {
        setIsCheckingStory(true)
        try {
            const response = await fetch('/api/check-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId: party.id,
                    victim: party.victim,
                    characters,
                    physicalClues: party.physical_clues
                })
            })
            const data = await response.json()
            setStoryCheckResult(data.analysis)
        } catch (error) {
            setStoryCheckResult('Error checking story coherence.')
        }
        setIsCheckingStory(false)
    }

    const handleAdjustStory = async () => {
        if (!adjustmentPrompt.trim()) return
        setIsAdjusting(true)
        try {
            await adjustStory(party.id, adjustmentPrompt)
            setAdjustmentPrompt('')
            onRefresh()
            setStoryCheckResult('Story updated successfully! Run a new check to verify.')
        } catch (error) {
            console.error('Adjustment failed', error)
            alert('Failed to adjust story')
        }
        setIsAdjusting(false)
    }

    return (
        <div className="space-y-8">
            {/* AI Story Assistant */}
            <div className="bg-gradient-to-r from-blue-900/30 to-slate-900/30 border border-blue-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-xl font-bold text-blue-400">AI Story Assistant</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Analysis Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">1. Analyze</h3>
                        <p className="text-slate-400 text-sm">
                            Get feedback on plot holes, consistency, and drama.
                        </p>
                        <button
                            onClick={checkStoryCoherence}
                            disabled={isCheckingStory || isAdjusting}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium text-sm"
                        >
                            {isCheckingStory ? 'Analyzing...' : 'Check Story Coherence'}
                        </button>
                    </div>

                    {/* Adjustment Column */}
                    <div className="space-y-4 border-l border-slate-800 pl-6">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">2. Adjust</h3>
                        <p className="text-slate-400 text-sm">
                            Tell the AI to change specific elements (e.g. "Make the victim a celebrity").
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={adjustmentPrompt}
                                onChange={(e) => setAdjustmentPrompt(e.target.value)}
                                placeholder="Instruction (e.g. 'Change the murder weapon to a poisoned apple')"
                                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                onClick={handleAdjustStory}
                                disabled={isAdjusting || !adjustmentPrompt.trim()}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 text-white rounded-lg font-medium text-sm whitespace-nowrap"
                            >
                                {isAdjusting ? 'Updating...' : 'Apply Changes'}
                            </button>
                        </div>
                    </div>
                </div>

                {storyCheckResult && (
                    <div className="mt-6 bg-slate-950 border border-slate-800 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-sm font-semibold text-blue-400 uppercase mb-2">AI Analysis / Status</h3>
                        <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                            {storyCheckResult}
                        </div>
                    </div>
                )}
            </div>

            {/* Victim Information */}
            {party.victim && (
                <div className="bg-slate-900 border border-red-900/50 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                        <span>💀</span> The Murder
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{party.victim.name}</h3>
                            <p className="text-slate-400 text-sm mb-1">{party.victim.role}</p>
                            <div className="mt-4 space-y-2 text-sm">
                                <p className="text-slate-300">
                                    <span className="text-red-400 font-medium">Cause:</span> {party.victim.causeOfDeath}
                                </p>
                                <p className="text-slate-300">
                                    <span className="text-red-400 font-medium">Time:</span> {party.victim.timeOfDeath}
                                </p>
                                <p className="text-slate-300">
                                    <span className="text-red-400 font-medium">Location:</span> {party.victim.location}
                                </p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Backstory</h4>
                            <p className="text-slate-300 text-sm leading-relaxed">{party.victim.backstory}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Physical Clue Checklist - Editable */}
            {party.physical_clues && party.physical_clues.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                        <span>🔍</span> Physical Clue Setup (Editable)
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Set up these physical clues BEFORE the game starts.
                    </p>
                    <div className="space-y-3">
                        {party.physical_clues.map((clue: any, idx: number) => (
                            <EditableClue
                                key={idx}
                                partyId={party.id}
                                clue={clue}
                                index={idx}
                                onUpdate={onRefresh}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Character Roles - Editable */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-purple-400 mb-6">Character Roles (Editable)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {characters.map((char: any) => (
                        <EditableCharacter
                            key={char.id}
                            character={char}
                            onUpdate={onRefresh}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
