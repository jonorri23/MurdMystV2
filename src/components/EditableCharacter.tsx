'use client'

import { useState } from 'react'
import { updateCharacter } from '@/app/actions'

export function EditableCharacter({ character, onUpdate }: {
    character: any
    onUpdate: () => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: character.name,
        role: character.role,
        backstory: character.backstory,
        secret_objective: character.secret_objective,
        opening_action: character.opening_action || '',
        relationships: character.relationships || [],
        quirks: character.quirks || []
    })

    const handleSave = async () => {
        await updateCharacter(character.id, formData)
        setIsEditing(false)
        onUpdate()
    }

    const isMurderer = character.secret_objective?.includes('MURDERER')

    if (!isEditing) {
        return (
            <div className={`bg-slate-950 border rounded-lg p-5 ${isMurderer ? 'border-red-900/50' : 'border-slate-800'
                }`}>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">{character.name}</h3>
                        <p className="text-slate-400 text-sm">{character.role}</p>
                    </div>
                    <div className="flex gap-2">
                        {isMurderer && (
                            <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs font-medium">
                                Murderer
                            </span>
                        )}
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium"
                        >
                            Edit
                        </button>
                    </div>
                </div>

                {character.opening_action && (
                    <div className="bg-yellow-950/20 border-l-2 border-yellow-600 rounded-r px-3 py-2 mb-3">
                        <p className="text-xs text-yellow-500 font-semibold uppercase">Opening Action</p>
                        <p className="text-yellow-200 text-sm mt-1">{character.opening_action}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Backstory</h4>
                        <p className="text-slate-300 text-sm">{character.backstory}</p>
                    </div>

                    {character.relationships && character.relationships.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Relationships</h4>
                            {character.relationships.map((rel: any, idx: number) => (
                                <p key={idx} className="text-xs text-slate-400 mb-1">
                                    <span className="text-purple-400">{rel.character}:</span> {rel.relationship}
                                </p>
                            ))}
                        </div>
                    )}

                    {character.quirks && character.quirks.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Quirks</h4>
                            <div className="flex flex-wrap gap-1">
                                {character.quirks.map((quirk: string, idx: number) => (
                                    <span key={idx} className="bg-purple-900/20 text-purple-400 px-2 py-0.5 rounded text-xs">
                                        {quirk}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-red-950/20 border border-red-900/30 rounded p-3">
                        <h4 className="text-xs font-semibold text-red-500 uppercase mb-1">Secret Objective</h4>
                        <p className="text-red-200 text-sm">{character.secret_objective}</p>
                    </div>
                </div>
            </div>
        )
    }

    // Edit mode
    return (
        <div className="bg-slate-950 border border-purple-600 rounded-lg p-5">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Character Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Role Description</label>
                        <input
                            type="text"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Opening Action</label>
                    <input
                        type="text"
                        value={formData.opening_action}
                        onChange={(e) => setFormData({ ...formData, opening_action: e.target.value })}
                        placeholder="E.g., Ask for a Linkin Park song"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Backstory</label>
                    <textarea
                        value={formData.backstory}
                        onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm resize-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Secret Objective</label>
                    <textarea
                        value={formData.secret_objective}
                        onChange={(e) => setFormData({ ...formData, secret_objective: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm resize-none"
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-sm"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
