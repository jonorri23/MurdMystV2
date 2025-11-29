import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        MurdMyst
                    </h1>
                    <p className="text-slate-400">
                        The AI-powered murder mystery party generator.
                    </p>
                </div>

                <div className="grid gap-4">
                    <form action={async () => {
                        'use server'
                        const { createParty } = await import('./actions')
                        const formData = new FormData()
                        await createParty(formData)
                    }} className="w-full">
                        <button className="w-full h-12 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center font-medium transition-colors">
                            Host a Party (Instant)
                        </button>
                    </form>

                    <Link href="/join" className="w-full">
                        <div className="h-12 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md flex items-center justify-center font-medium transition-colors border border-slate-700">
                            Join a Party
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    );
}
