import { createParty } from '@/app/actions';
import { Button } from '@/components/ui/button';

export default function CreatePartyPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Create Your Party
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Give your mystery a name and set a secure PIN.
                    </p>
                </div>

                <form action={createParty} className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-300">
                            Party Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            placeholder="e.g. The Manor Mystery"
                            className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="hostPin" className="text-sm font-medium text-slate-300">
                            Host PIN (4-6 digits)
                        </label>
                        <input
                            id="hostPin"
                            name="hostPin"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            required
                            placeholder="1234"
                            className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600"
                        />
                        <p className="text-xs text-slate-500">
                            You'll use this to access the Host Dashboard.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="storyTheme" className="text-sm font-medium text-slate-300">
                            Story/Theme
                        </label>
                        <textarea
                            id="storyTheme"
                            name="storyTheme"
                            rows={3}
                            placeholder='e.g. "Pokemon", "1920s Gatsby party", "Sci-fi space station"...'
                            className="w-full p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600 resize-none"
                        />
                        <p className="text-xs text-slate-500">
                            Describe the story theme or just name it. The AI will build a full mystery around it.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="venueDescription" className="text-sm font-medium text-slate-300">
                            Physical Venue (Optional)
                        </label>
                        <textarea
                            id="venueDescription"
                            name="venueDescription"
                            rows={3}
                            placeholder="e.g. My living room, a garden, a basement, John's apartment with a piano..."
                            className="w-full p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-600 resize-none"
                        />
                        <p className="text-xs text-slate-500">
                            Describe the REAL location where you're playing. AI will use this for clues.
                        </p>
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        Start Planning
                    </Button>
                </form>
            </div>
        </div>
    );
}
