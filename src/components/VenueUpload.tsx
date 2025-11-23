'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle, Camera } from 'lucide-react'
import { analyzeVenue } from '@/app/actions'
import { toast } from 'sonner'

export function VenueUpload({ partyId, onAnalysisComplete }: { partyId: string, onAnalysisComplete?: () => void }) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle')
    const [analysisResult, setAnalysisResult] = useState<any>(null)
    const router = useRouter()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // Show previews
        const newUrls = Array.from(files).map(file => URL.createObjectURL(file))
        setPreviewUrls(newUrls)
        setAnalysisStatus('idle')
    }

    const handleUpload = async () => {
        if (previewUrls.length === 0) return

        setIsUploading(true)
        setAnalysisStatus('uploading')

        try {
            // Get the file from the input again or fetch from blob url (easier to just keep ref or get from form)
            // For simplicity, let's assume the user just selected it. 
            // Actually, we need to pass the file to the server action. 
            // Server actions with files need FormData.

            const fileInput = document.getElementById('venue-upload-input') as HTMLInputElement
            const files = fileInput?.files
            if (!files || files.length === 0) throw new Error('No files selected')

            const formData = new FormData()
            Array.from(files).forEach(file => {
                formData.append('file', file)
            })
            formData.append('partyId', partyId)

            setAnalysisStatus('analyzing')
            const result = await analyzeVenue(formData)
            setAnalysisResult(result)

            setAnalysisStatus('complete')
            toast.success('Venue analyzed successfully!')
            router.refresh() // Refresh to show new setting description
            if (onAnalysisComplete) onAnalysisComplete()

        } catch (error) {
            console.error(error)
            toast.error('Failed to analyze venue')
            setAnalysisStatus('idle')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-400" />
                    Venue Analysis (Optional)
                </h3>
                {analysisStatus === 'complete' && (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Analyzed
                    </span>
                )}
            </div>

            <p className="text-zinc-400 text-sm">
                Upload a photo of your party space. AI will analyze it to suggest hiding spots and tailor the mystery to your room.
                <br /><span className="text-zinc-500 italic">You can skip this step if you prefer a generic setting.</span>
            </p>

            <div className="space-y-4">
                <div className="relative min-h-[200px] bg-zinc-950 rounded-lg border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center overflow-hidden group hover:border-zinc-700 transition-colors p-4">
                    {previewUrls.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 w-full">
                            {previewUrls.map((url, idx) => (
                                <img key={idx} src={url} alt={`Venue preview ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-4">
                            <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                            <p className="text-zinc-500 text-sm">Click to upload photos (select multiple)</p>
                        </div>
                    )}

                    <input
                        id="venue-upload-input"
                        type="file"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>

                {previewUrls.length > 0 && analysisStatus !== 'complete' && (
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {analysisStatus === 'uploading' ? 'Uploading...' : 'Analyzing...'}
                            </>
                        ) : (
                            'Analyze Venue'
                        )}
                    </button>
                )}

                {/* Debug / Result Display */}
                {analysisResult && (
                    <div className="bg-slate-950 p-4 rounded-md border border-slate-800 text-xs font-mono text-slate-300 mt-4">
                        <p className="font-bold text-purple-400 mb-2">Analysis Result (Debug):</p>
                        <div className="space-y-1">
                            <p><span className="text-slate-500">Room:</span> {analysisResult.roomType}</p>
                            <p><span className="text-slate-500">Mood:</span> {analysisResult.atmosphere}</p>
                            <p><span className="text-slate-500">Objects:</span> {analysisResult.keyObjects.join(', ')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
