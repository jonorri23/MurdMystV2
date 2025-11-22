'use client'

export function WinningPath() {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                <span>🏆</span> How Guests Win (The Game Loop)
            </h2>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800" />

                <div className="space-y-8 relative">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500 flex items-center justify-center text-blue-400 font-bold z-10 shrink-0">
                            1
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Social Engineering</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Guests use their <strong>Secrets</strong> and <strong>Relationships</strong> to extract info.
                                <br />
                                <em className="text-slate-500">"I know you were fighting with the victim. Why?"</em>
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500 flex items-center justify-center text-purple-400 font-bold z-10 shrink-0">
                            2
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Physical Investigation</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Guests find the <strong>Physical Clues</strong> you hid.
                                <br />
                                <em className="text-slate-500">"A torn check found under the piano proves the blackmail."</em>
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-red-900/50 border border-red-500 flex items-center justify-center text-red-400 font-bold z-10 shrink-0">
                            3
                        </div>
                        <div>
                            <h3 className="text-white font-bold">The Twist & Accusation</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                You (Host) announce the <strong>Murder</strong> and reveal a final twist.
                                Guests combine their secrets + clues to identify the killer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
