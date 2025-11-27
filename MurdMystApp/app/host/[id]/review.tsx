import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { ChevronRight, User, MapPin, Key, BookOpen, AlertTriangle, CheckCircle, Edit2, Save } from 'lucide-react-native';
import { Input } from '../../../components/ui/Input';

const TABS = ['Overview', 'Characters', 'Clues', 'Solution'];

export default function ReviewMystery() {
    const { id } = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState('Overview');
    const [party, setParty] = useState<any>(null);
    const [characters, setCharacters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editValue, setEditValue] = useState('');
    const [editField, setEditField] = useState('');
    const [saving, setSaving] = useState(false);

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
            const { data: chars, error: charsError } = await supabase
                .from('characters')
                .select('*, guests(name, access_pin)')
                .in('guest_id', guestIds);

            if (chars) setCharacters(chars);
        }

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
                            router.replace(`/host/${id}/dashboard`);
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item: any, field: string, value: string) => {
        setEditingItem(item);
        setEditField(field);
        setEditValue(value);
    };

    const saveEdit = async () => {
        if (!editingItem || !editField) return;
        setSaving(true);

        try {
            let table = 'characters';
            if (activeTab === 'Clues') table = 'parties'; // Special case for JSON array update

            if (table === 'characters') {
                const { error } = await supabase
                    .from('characters')
                    .update({ [editField]: editValue })
                    .eq('id', editingItem.id);

                if (error) throw error;

                // Update local state
                setCharacters(chars => chars.map(c => c.id === editingItem.id ? { ...c, [editField]: editValue } : c));
            } else if (activeTab === 'Clues') {
                // For clues, we need to update the entire JSON array in parties table
                const newClues = [...party.physical_clues];
                newClues[editingItem.index] = { ...newClues[editingItem.index], [editField]: editValue };

                const { error } = await supabase
                    .from('parties')
                    .update({ physical_clues: newClues })
                    .eq('id', id);

                if (error) throw error;
                setParty(p => ({ ...p, physical_clues: newClues }));
            }

            setEditingItem(null);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
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
                    </View>
                )}

                {activeTab === 'Characters' && (
                    <View className="space-y-4 pb-24">
                        {characters.map((char) => (
                            <View key={char.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {char.portrait_url && (
                                    <Image
                                        source={{ uri: char.portrait_url }}
                                        className="w-full h-48 bg-slate-200 dark:bg-slate-800"
                                        resizeMode="cover"
                                    />
                                )}
                                <View className="p-4">
                                    <View className="flex-row justify-between items-start mb-2">
                                        <View>
                                            <Text className="text-xl font-bold text-slate-900 dark:text-white">{char.name}</Text>
                                            <Text className="text-indigo-500 font-medium">{char.role}</Text>
                                        </View>
                                        {char.secret_objective?.includes('MURDERER') && (
                                            <View className="bg-red-100 px-2 py-1 rounded">
                                                <Text className="text-red-700 text-xs font-bold">KILLER</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-row items-center justify-between mb-3">
                                        <Text className="text-slate-500 text-xs">Played by: {char.guests?.name}</Text>
                                        <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-row items-center gap-1">
                                            <Key size={10} color="#64748b" />
                                            <Text className="text-slate-600 dark:text-slate-400 text-xs font-mono font-bold">PIN: {char.guests?.access_pin}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-start gap-2 mb-3">
                                        <Text className="text-slate-700 dark:text-slate-300 flex-1" numberOfLines={3}>{char.backstory}</Text>
                                        <TouchableOpacity onPress={() => handleEdit(char, 'backstory', char.backstory)}>
                                            <Edit2 size={16} color="#6366f1" />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <Text className="text-xs font-bold text-slate-500 uppercase mb-1">Secret Objective</Text>
                                        <Text className="text-slate-700 dark:text-slate-300 text-sm">{char.secret_objective}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {activeTab === 'Clues' && (
                    <View className="space-y-4 pb-24">
                        <Text className="text-slate-500 dark:text-slate-400 mb-2">
                            Hide these clues around the venue before starting the game.
                        </Text>
                        {party.physical_clues?.map((clue: any, index: number) => (
                            <View key={index} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <View className="flex-row items-center gap-3 mb-3">
                                    <View className="bg-orange-100 p-2 rounded-full">
                                        <Key size={20} color="#f97316" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-slate-900 dark:text-white">{clue.description}</Text>
                                        <Text className="text-orange-600 text-xs font-medium uppercase">{clue.timing}</Text>
                                    </View>
                                </View>

                                <View className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mb-3">
                                    <Text className="text-xs font-bold text-slate-500 uppercase mb-1">Setup Instruction</Text>
                                    <Text className="text-xs font-bold text-slate-500 uppercase mb-1">Setup Instruction</Text>
                                    <View className="flex-row items-start gap-2">
                                        <Text className="text-slate-700 dark:text-slate-300 flex-1">{clue.setupInstruction}</Text>
                                        <TouchableOpacity onPress={() => handleEdit({ ...clue, index }, 'setupInstruction', clue.setupInstruction)}>
                                            <Edit2 size={14} color="#6366f1" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className="border-l-4 border-slate-300 dark:border-slate-700 pl-3 py-1">
                                    <Text className="text-slate-600 dark:text-slate-400 italic">"{clue.content}"</Text>
                                </View>

                                {clue.hasUnlockCode && (
                                    <View className="mt-3 flex-row items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg">
                                        <Text className="text-indigo-600 dark:text-indigo-400 font-bold">PIN Code:</Text>
                                        <Text className="text-indigo-700 dark:text-indigo-300 font-mono">{clue.unlockCode}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
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

            {/* Edit Modal */}
            <Modal
                visible={!!editingItem}
                transparent
                animationType="fade"
                onRequestClose={() => setEditingItem(null)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center p-4">
                    <View className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Content</Text>

                        <TextInput
                            value={editValue}
                            onChangeText={setEditValue}
                            multiline
                            className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white min-h-[100px] mb-4"
                            textAlignVertical="top"
                        />

                        <View className="flex-row gap-3">
                            <Button
                                title="Cancel"
                                variant="outline"
                                onPress={() => setEditingItem(null)}
                                className="flex-1"
                            />
                            <Button
                                title="Save"
                                onPress={saveEdit}
                                loading={saving}
                                className="flex-1"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
