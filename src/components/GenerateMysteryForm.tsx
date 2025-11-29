'use client'

import { useState } from 'react'
import { generateMystery } from '@/app/actions'

interface GenerateMysteryFormProps {
    partyId: string
    guestCount: number
}

export function GenerateMysteryForm({ partyId, guestCount }: GenerateMysteryFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [generatePortraits, setGeneratePortraits] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            await generateMystery(partyId, generatePortraits)
            // The action will redirect to /host/${partyId}/review on success
        } catch (err: any) {
            setError(err.message || 'Failed to generate mystery')
            setIsLoading(false)
        }
    }

    const isDisabled = guestCount < 3 || isLoading

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* DALL-E Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={generatePortraits}
                    onChange={(e) => setGeneratePortraits(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-2 focus:ring-purple-600 focus:ring-offset-0 disabled:opacity-50"
                />
                <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
                    Generate profile pictures with DALL-E
                    <span className="text-xs text-slate-500 ml-2">(adds ~30s per character)</span>
                </span>
            </label>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isDisabled}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Generating Mystery...</span>
                    </>
                ) : (
                    guestCount < 3 ? `Need ${3 - guestCount} more guests` : 'Generate Mystery'
                )}
            </button>
        </form>
    )
}
