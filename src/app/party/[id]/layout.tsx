import { RealtimeProvider } from '@/components/realtime-provider';

export default async function PartyLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <RealtimeProvider partyId={id}>
            {children}
        </RealtimeProvider>
    );
}
