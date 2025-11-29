'use client'

import { useState } from 'react'
import { updateInAppClue, deleteInAppClue } from '@/app/actions'

export function EditableGameEvent({
    event,
    characters,
    onUpdate
}: {
    event: any
    characters: any[]
    onUpdate: () => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Helper to get role names from guest IDs
    const getTargetRoles = () => {
        if (!event.target_guest_ids) return []
        const ids = Array.isArray(event.target_guest_ids) ? event.target_guest_ids : JSON.parse(event.target_guest_ids)
        return characters.filter(c => ids.includes(c.guest_id)).map(c => c.role)
    }

    const [formData, setFormData] = useState({
        content: event.content,
        targetRoles: getTargetRoles() as string[]
    })

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await updateInAppClue(event.id, formData.content, formData.targetRoles)
            setIsEditing(false)
            onUpdate()
        } catch (error) {
            console.error('Update failed', error)
            alert('Failed to update event')
        }
        setIsLoading(false)
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event?')) return
        setIsLoading(true)
        try {
            await deleteInAppClue(event.id)
            onUpdate()
        } catch (error) {
            console.error('Delete failed', error)
            alert('Failed to delete event')
        }
        setIsLoading(false)
    }

    const toggleRole = (role: string) => {
        if (formData.targetRoles.includes(role)) {
            setFormData({ ...formData, targetRoles: formData.targetRoles.filter(r => r !== role) })
        } else {
            setFormData({ ...formData, targetRoles: [...formData.targetRoles, role] })
        }
    }

    if (!isEditing) {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs font-medium">
                            In-App Clue
                        </span>
                        <span className="text-xs text-slate-500">
                            {event.trigger_time ? 'Sent' : 'Scheduled'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 px-2 py-1 rounded transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
                <p className="text-slate-300 text-sm mb-2">{event.content}</p>
                <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-slate-500 mr-1">Targets:</span>
                    {getTargetRoles().length > 0 ? (
                        getTargetRoles().map((role, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                                {role}
                            </span>
                        ))
                    ) : (
                        <span className="bg-green-900/20 text-green-400 px-1.5 py-0.5 rounded text-[10px]">
                            Everyone
                        </span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-950 border border-purple-600 rounded-lg p-4">
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Content</label>
                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm resize-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-2">Target Roles (Select none for Everyone)</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-900 rounded border border-slate-800">
                        {characters.map((char) => (
                            <button
                                key={char.id}
                                onClick={() => toggleRole(char.role)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${formData.targetRoles.includes(char.role)
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {char.role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium"
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
