'use client'

import { useState } from 'react'
import { updatePhysicalClue, regenerateClue } from '@/app/actions'

export function EditableClue({
    partyId,
    clue,
    index,
    onUpdate
}: {
    partyId: string
    clue: any
    index: number
    onUpdate: () => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [isRegenerating, setIsRegenerating] = useState(false)
    const [regenPrompt, setRegenPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        description: clue.description,
        setupInstruction: clue.setupInstruction,
        content: clue.content,
        timing: clue.timing,
        relatedTo: clue.relatedTo || []
    })

    const handleSave = async () => {
        await updatePhysicalClue(partyId, index, formData)
        setIsEditing(false)
        onUpdate()
    }

    const handleRegenerate = async () => {
        if (!regenPrompt.trim()) return
        setIsLoading(true)
        try {
            await regenerateClue(partyId, index, regenPrompt)
            setIsRegenerating(false)
            setRegenPrompt('')
            onUpdate()
        } catch (error) {
            console.error('Regeneration failed', error)
            alert('Failed to regenerate clue')
        }
        setIsLoading(false)
    }

    if (isRegenerating) {
        return (
            <div className="bg-slate-950 border border-blue-600 rounded-lg p-4">
                <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                    <span>🤖</span> AI Clue Regeneration
                </h3>
                <textarea
                    value={regenPrompt}
                    onChange={(e) => setRegenPrompt(e.target.value)}
                    placeholder="E.g. 'Make it a bloody knife instead', 'Hide it in the fridge'"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded text-white text-sm mb-3 h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleRegenerate}
                        disabled={isLoading || !regenPrompt.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded text-xs font-medium flex items-center gap-2"
                    >
                        {isLoading ? 'Regenerating...' : '✨ Regenerate'}
                    </button>
                    <button
                        onClick={() => setIsRegenerating(false)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    if (!isEditing) {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${clue.timing === 'pre-dinner'
                            ? 'bg-blue-900/30 text-blue-400'
                            : 'bg-orange-900/30 text-orange-400'
                            }`}>
                            {clue.timing === 'pre-dinner' ? 'Pre-Dinner' : 'Post-Murder'}
                        </span>
                        <h3 className="text-white font-medium">{clue.description}</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsRegenerating(true)}
                            className="px-2 py-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800/50 rounded text-xs font-medium"
                        >
                            ✨ AI Edit
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
                        >
                            Edit
                        </button>
                    </div>
                </div>
                <p className="text-purple-400 text-sm font-medium mb-2">
                    📍 {clue.setupInstruction}
                </p>
                <p className="text-slate-400 text-sm italic">"{clue.content}"</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-950 border border-purple-600 rounded-lg p-4">
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Timing</label>
                        <select
                            value={formData.timing}
                            onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        >
                            <option value="pre-dinner">Pre-Dinner</option>
                            <option value="post-murder">Post-Murder</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Setup Instruction</label>
                    <input
                        type="text"
                        value={formData.setupInstruction}
                        onChange={(e) => setFormData({ ...formData, setupInstruction: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Clue Content</label>
                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm resize-none"
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
