import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { AlertTriangle } from 'lucide-react-native';
import { EditableCharacter } from '../../../components/EditableCharacter';
import { EditableClue } from '../../../components/EditableClue';
import { EditableGameEvent } from '../../../components/EditableGameEvent';

const TABS = ['Overview', 'Characters', 'Clues', 'Solution'];

export default function ReviewMystery() {
    const { id } = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState('Overview');
    const [party, setParty] = useState<any>(null);
    const [characters, setCharacters] = useState<any[]>([]);
    const [gameEvents, setGameEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        const { data: partyData, error: partyError } = await supabase
            .from('parties')
            .select('*')
            .eq('id', id)
            .single();

        if (partyError) {
            Alert.alert('Error', partyError.message);
            return;
        }

        setParty(partyData);

        const { data: guests } = await supabase
            .from('guests')
            .select('id, access_pin')
            .eq('party_id', id);

        if (guests && guests.length > 0) {
            const guestIds = guests.map(g => g.id);
            const { data: chars } = await supabase
                .from('characters')
                .select('*, guests(name, access_pin)')
                .in('guest_id', guestIds);

            if (chars) setCharacters(chars);
        }

        const { data: events } = await supabase
            .from('game_events')
            .select('*')
            .eq('party_id', id)
            .eq('event_type', 'clue')
            .order('trigger_time', { ascending: true });

        if (events) setGameEvents(events);

        setLoading(false);
    }

    const startGame = async () => {
        Alert.alert(
            'Start Game',
            'This will reveal character roles to all guests. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start Game',
                    onPress: async () => {
                        setStarting(true);
                        const { error } = await supabase
                            .from('parties')
                            .update({ status: 'active' })
                            .eq('id', id);

                        if (error) {
                            Alert.alert('Error', error.message);
                            setStarting(false);
                        } else {
                            router.replace(`/host/${id}/game`);
                        }
                    }
                }
            ]
        );
    };

    const handleClueSave = async (updatedClue: any, index: number) => {
        const newClues = [...party.physical_clues];
        newClues[index] = updatedClue;

        const { error } = await supabase
            .from('parties')
            .update({ physical_clues: newClues })
            .eq('id', id);

        if (error) throw error;
        setParty((p: any) => ({ ...p, physical_clues: newClues }));
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
                <ActivityIndicator size="large" color="#6366f1" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <Stack.Screen
                options={{
                    title: 'Review Mystery',
                    headerBackTitle: 'Back',
                }}
            />

            {/* Tabs */}
            <View className="flex-row px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`mr-4 px-4 py-2 rounded-full ${activeTab === tab ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}
                        >
                            <Text className={`font-medium ${activeTab === tab ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {activeTab === 'Overview' && (
                    <View className="space-y-6 pb-24">
                        <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{party.name}</Text>
                            <Text className="text-slate-500 dark:text-slate-400 italic mb-4">{party.story_theme}</Text>
                            <Text className="text-slate-700 dark:text-slate-300 leading-6">{party.intro}</Text>
                        </View>

                        <View className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/50">
                            <View className="flex-row items-center gap-2 mb-4">
                                <AlertTriangle size={24} color="#ef4444" />
                                <Text className="text-xl font-bold text-red-700 dark:text-red-400">The Victim</Text>
                            </View>
                            <View className="space-y-2">
                                <Text className="font-bold text-slate-900 dark:text-white text-lg">{party.victim?.name}</Text>
                                <Text className="text-slate-600 dark:text-slate-400">{party.victim?.role}</Text>
                                <View className="h-px bg-red-200 dark:bg-red-800/50 my-2" />
                                <Text className="text-slate-700 dark:text-slate-300"><Text className="font-bold">Cause of Death:</Text> {party.victim?.causeOfDeath}</Text>
                                <Text className="text-slate-700 dark:text-slate-300"><Text className="font-bold">Location:</Text> {party.victim?.location}</Text>
                                <Text className="text-slate-700 dark:text-slate-300 mt-2">{party.victim?.backstory}</Text>
                            </View>
                        </View>

                        <Button
                            title="Start Game"
                            onPress={startGame}
                            loading={starting}
                            className="mt-4"
                        />
                    </View>
                )}

                {activeTab === 'Characters' && (
                    <View className="space-y-4 pb-24">
                        {characters.map((char) => (
                            <EditableCharacter
                                key={char.id}
                                character={char}
                                onUpdate={fetchData}
                            />
                        ))}
                    </View>
                )}

                {activeTab === 'Clues' && (
                    <View className="space-y-4 pb-24">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">Physical Clues</Text>
                        <Text className="text-slate-500 dark:text-slate-400 mb-2">
                            Hide these clues around the venue before starting the game.
                        </Text>
                        {party.physical_clues?.map((clue: any, index: number) => (
                            <EditableClue
                                key={index}
                                clue={clue}
                                index={index}
                                onSave={handleClueSave}
                            />
                        ))}

                        <Text className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-2">In-App Clues</Text>
                        <Text className="text-slate-500 dark:text-slate-400 mb-2">
                            These clues will be sent to guests automatically or manually.
                        </Text>
                        {gameEvents.map((event) => (
                            <EditableGameEvent
                                key={event.id}
                                event={event}
                                onUpdate={fetchData}
                            />
                        ))}
                        {gameEvents.length === 0 && (
                            <Text className="text-slate-500 italic">No in-app clues generated.</Text>
                        )}
                    </View>
                )}

                {activeTab === 'Solution' && (
                    <View className="space-y-6 pb-24">
                        <View className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <Text className="text-white font-bold text-lg mb-4">Complete Solution</Text>

                            <View className="space-y-4">
                                <View>
                                    <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Timeline</Text>
                                    <View className="space-y-2">
                                        <Text className="text-slate-300">Murder Time: {party.solution_metadata?.timeline?.murderTime}</Text>
                                        {party.solution_metadata?.timeline?.eventSequence?.map((event: string, i: number) => (
                                            <Text key={i} className="text-slate-400 text-sm">• {event}</Text>
                                        ))}
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Steps to Solve</Text>
                                    {party.solution_metadata?.completeSolution?.steps?.map((step: string, i: number) => (
                                        <View key={i} className="flex-row gap-3 mb-2">
                                            <View className="bg-slate-800 w-6 h-6 rounded-full items-center justify-center">
                                                <Text className="text-slate-400 text-xs">{i + 1}</Text>
                                            </View>
                                            <Text className="text-slate-300 flex-1">{step}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
