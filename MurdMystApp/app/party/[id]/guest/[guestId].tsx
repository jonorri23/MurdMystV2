import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Scroll, Key } from 'lucide-react-native';
import { supabase } from '../../../../lib/supabase';

export default function GuestDashboard() {
    const { id: partyId, guestId } = useLocalSearchParams();
    const [guest, setGuest] = useState<any>(null);
    const [character, setCharacter] = useState<any>(null);
    const [clues, setClues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        // Fetch Guest
        const { data: guestData } = await supabase
            .from('guests')
            .select('*')
            .eq('id', guestId)
            .single();

        setGuest(guestData);

        // Fetch Character
        if (guestData?.id) {
            const { data: charData } = await supabase
                .from('characters')
                .select('*')
                .eq('guest_id', guestData.id)
                .single();

            setCharacter(charData);
        }

        // Fetch Clues (Game Events targeted at this guest or all)
        // We need to filter client side or use complex query because target_guest_ids is JSONB array
        // For now, fetch all clues for party and filter
        const { data: events } = await supabase
            .from('game_events')
            .select('*')
            .eq('party_id', partyId)
            .order('created_at', { ascending: false });

        if (events) {
            const myClues = events.filter(e => {
                if (!e.target_guest_ids) return true; // Broadcast
                // Check if guestId is in the array
                const targets = Array.isArray(e.target_guest_ids) ? e.target_guest_ids : JSON.parse(e.target_guest_ids);
                return targets.includes(guestId);
            });
            setClues(myClues);
        }

        setLoading(false);
    }

    useEffect(() => {
        fetchData();

        // Realtime subscription for clues
        const subscription = supabase
            .channel('guest_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_events', filter: `party_id=eq.${partyId}` }, (payload) => {
                // Check if relevant to me
                const event = payload.new;
                let isForMe = false;
                if (!event.target_guest_ids) isForMe = true;
                else {
                    const targets = Array.isArray(event.target_guest_ids) ? event.target_guest_ids : JSON.parse(event.target_guest_ids);
                    if (targets.includes(guestId)) isForMe = true;
                }

                if (isForMe) {
                    Alert.alert('New Clue!', 'You received a new clue.');
                    fetchData();
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [guestId, partyId]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-slate-950">
                <Text className="text-white">Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView className="flex-1 px-6 pt-6">
                <Text className="text-3xl font-bold text-white mb-2">
                    {character?.name || guest?.name}
                </Text>
                <Text className="text-slate-400 mb-6">
                    {character?.role || 'Waiting for role assignment...'}
                </Text>

                {character && (
                    <View className="space-y-6 mb-8">
                        {character.portrait_url && (
                            <Image
                                source={{ uri: character.portrait_url }}
                                className="w-full h-64 rounded-2xl bg-slate-800"
                                resizeMode="cover"
                            />
                        )}

                        <View className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <View className="flex-row items-center mb-2">
                                <User size={20} color="#a855f7" />
                                <Text className="text-purple-400 font-bold ml-2">Your Secret Objective</Text>
                            </View>
                            <Text className="text-slate-300 leading-relaxed">
                                {character.secret_objective}
                            </Text>
                        </View>

                        <View className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <View className="flex-row items-center mb-2">
                                <Scroll size={20} color="#3b82f6" />
                                <Text className="text-blue-400 font-bold ml-2">Backstory</Text>
                            </View>
                            <Text className="text-slate-300 leading-relaxed">
                                {character.backstory}
                            </Text>
                        </View>
                    </View>
                )}

                <View className="mb-12">
                    <Text className="text-xl font-bold text-white mb-4">Clues & Events</Text>
                    <View className="space-y-3">
                        {clues.map((clue) => (
                            <View key={clue.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-xs text-slate-500">
                                        {new Date(clue.created_at).toLocaleTimeString()}
                                    </Text>
                                    <Key size={14} color="#64748b" />
                                </View>
                                <Text className="text-slate-200">
                                    {clue.content}
                                </Text>
                            </View>
                        ))}
                        {clues.length === 0 && (
                            <Text className="text-slate-600 text-center italic">
                                No clues yet. Keep your eyes open.
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
