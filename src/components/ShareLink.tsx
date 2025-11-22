'use client'

export function ShareLink({ gameId }: { gameId: string }) {
    const link = typeof window !== 'undefined'
        ? `${window.location.origin}/join/${gameId}`
        : `https://murdmyst.com/join/${gameId}`

    return (
        <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-dashed border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Share this Party ID with guests:</p>
            <code className="bg-slate-900 px-3 py-2 rounded text-purple-400 font-mono select-all block text-center text-xl font-bold mb-4">{gameId}</code>

            <p className="text-sm text-slate-400 mb-2">Or send them this direct link:</p>
            <div className="flex gap-2">
                <code className="flex-1 bg-slate-900 px-3 py-2 rounded text-slate-300 font-mono text-xs select-all break-all overflow-hidden">
                    {link}
                </code>
                <button
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors shrink-0"
                    onClick={() => {
                        navigator.clipboard.writeText(link)
                        alert('Link copied!')
                    }}
                >
                    Copy
                </button>
            </div>
            <p className="text-xs text-slate-500 mt-3">Guests will use their PIN to log in and see their role.</p>
        </div>
    )
}
