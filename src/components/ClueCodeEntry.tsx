'use client';

import { useState, FormEvent } from 'react';
import { unlockClueCode } from '@/app/actions';

interface Props {
    partyId: string;
    guestId: string;
}

export function ClueCodeEntry({ partyId, guestId }: Props) {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!code) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('partyId', partyId);
            formData.append('guestId', guestId);
            formData.append('code', code);

            const res = await unlockClueCode(formData);

            if (res.success) {
                setResult(res);
                setCode(''); // Clear input on success
            } else {
                setError(res.message || 'Failed to unlock clue');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-100">Found a Physical Clue?</h3>
                    <p className="text-xs text-slate-400">Enter the 4-digit PIN code printed on it</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter PIN"
                        className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-center text-lg tracking-widest font-mono placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !code}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        {isLoading ? '...' : 'Unlock'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    {error}
                </div>
            )}

            {result?.success && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2 text-green-400 font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        {result.alreadyUnlocked ? 'Clue Already Unlocked!' : 'Clue Unlocked!'}
                    </div>

                    <div className="bg-black/30 p-3 rounded border border-green-500/20 text-slate-200">
                        {result.content.content}
                    </div>

                    {result.content.broadcastToAll && (
                        <p className="mt-2 text-xs text-purple-300 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8v-2c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v2" /><rect width="20" height="12" x="2" y="8" rx="2" ry="2" /><path d="M12 14h.01" /></svg>
                            Broadcast sent to all players
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
