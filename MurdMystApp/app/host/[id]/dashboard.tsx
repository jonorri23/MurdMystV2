import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Share, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, Link, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, MapPin, Sparkles, Copy, Share2, UserPlus, Trash2, X, LogOut, Settings, BookOpen, Clock, Brain } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const DURATIONS = ['30-60m', '60-90m', '90-120m'];
const COMPLEXITIES = ['easy', 'balanced', 'hard'];

export default function PartyDashboard() {
    const { id } = useLocalSearchParams();
    const [party, setParty] = useState<any>(null);
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddGuestModal, setShowAddGuestModal] = useState(false);
    const [newGuestName, setNewGuestName] = useState('');
    const [newGuestNotes, setNewGuestNotes] = useState('');
    const [addingGuest, setAddingGuest] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Party Settings State
    const [theme, setTheme] = useState('');
    const [venueDescription, setVenueDescription] = useState('');
    const [duration, setDuration] = useState('60-90m');
    const [complexity, setComplexity] = useState('balanced');
    const [showSettings, setShowSettings] = useState(true);

    async function fetchPartyDetails() {
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
        setTheme(partyData.story_theme || '');
        setVenueDescription(partyData.setting_description || '');
        setDuration(partyData.target_duration || '60-90m');
        setComplexity(partyData.complexity || 'balanced');

        const { data: guestsData, error: guestsError } = await supabase
            .from('guests')
            .select('*')
            .eq('party_id', id);

        if (guestsData) {
            setGuests(guestsData);
        }

        setLoading(false);
    }

    useEffect(() => {
        fetchPartyDetails();

        // Subscribe to changes
        const subscription = supabase
            .channel('party_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'guests', filter: `party_id=eq.${id}` }, () => {
                fetchPartyDetails();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parties', filter: `id=eq.${id}` }, () => {
                fetchPartyDetails();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [id]);

    const addGuest = async () => {
        if (!newGuestName.trim()) {
            Alert.alert('Error', 'Please enter a guest name');
            return;
        }

        setAddingGuest(true);
        const accessPin = Math.floor(1000 + Math.random() * 9000).toString();

        const { error } = await supabase
            .from('guests')
            .insert([
                {
                    party_id: id,
                    name: newGuestName.trim(),
                    personality_notes: newGuestNotes.trim() || null,
                    access_pin: accessPin,
                }
            ]);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setNewGuestName('');
            setNewGuestNotes('');
            setShowAddGuestModal(false);
            fetchPartyDetails();
        }
        setAddingGuest(false);
    };

    const removeGuest = async (guestId: string, guestName: string) => {
        Alert.alert(
            'Remove Guest',
            `Are you sure you want to remove ${guestName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('guests')
                            .delete()
                            .eq('id', guestId);

                        if (error) {
                            Alert.alert('Error', error.message);
                        } else {
                            fetchPartyDetails();
                        }
                    }
                }
            ]
        );
    };

    const shareInvite = async () => {
        try {
            await Share.share({
                message: `Join my murder mystery party! Party Name: ${party.name}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const copyGameId = async () => {
        await Clipboard.setStringAsync(id as string);
        Alert.alert('Copied!', 'Game ID copied to clipboard');
    };

    const saveSettings = async () => {
        const { error } = await supabase
            .from('parties')
            .update({
                name: party.name,
                story_theme: theme,
                setting_description: venueDescription,
                target_duration: duration,
                complexity: complexity
            })
            .eq('id', id);

        if (error) throw error;
    };

    const generateMystery = async () => {
        if (guests.length < 3) {
            Alert.alert('Not Enough Guests', 'You need at least 3 guests to generate a mystery.');
            return;
        }

        Alert.alert(
            'Generate Mystery',
            `This will create a unique murder mystery for ${guests.length} guests. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate',
                    onPress: async () => {
                        setGenerating(true);
                        try {
                            // Save settings first
                            await saveSettings();

                            const { data, error } = await supabase.functions.invoke('generate-mystery', {
                                body: { partyId: id },
                            });

                            if (error) throw error;

                            Alert.alert('Success', 'Mystery generated! Check the review page.');
                            fetchPartyDetails();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to generate mystery');
                        } finally {
                            setGenerating(false);
                        }
                    }
                }
            ]
        );
    };

    const logout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
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
                    title: party?.name || 'Dashboard',
                    headerBackTitle: 'Back',
                    headerRight: () => (
                        <TouchableOpacity onPress={logout}>
                            <LogOut size={20} color="#ef4444" />
                        </TouchableOpacity>
                    )
                }}
            />

            <ScrollView className="flex-1 px-6 pt-4">
                {/* Header Status */}
                <View className="bg-indigo-600 p-6 rounded-2xl mb-6">
                    <Text className="text-indigo-100 font-medium mb-1">Status</Text>
                    <Text className="text-3xl font-bold text-white capitalize mb-4">
                        {party.status}
                    </Text>
                    <View className="flex-row gap-2">
                        <View className="bg-indigo-500/50 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-medium">
                                PIN: {party.host_pin}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Game ID Card */}
                <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
                    <Text className="text-slate-500 dark:text-slate-400 font-medium mb-2">Game ID</Text>
                    <View className="flex-row items-center justify-between">
                        <Text className="text-slate-900 dark:text-white font-mono text-base flex-1">
                            {id}
                        </Text>
                        <TouchableOpacity
                            onPress={copyGameId}
                            className="bg-indigo-600 p-3 rounded-lg ml-2"
                        >
                            <Copy size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-xs text-slate-400 mt-2">Share this ID with guests for direct access</Text>
                </View>

                {/* Party Settings Card */}
                {party.status === 'planning' && (
                    <View className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white flex-row items-center">
                                <Settings size={18} color="#6366f1" /> Party Settings
                            </Text>
                            <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
                                <Text className="text-indigo-500 font-medium">{showSettings ? 'Hide' : 'Edit'}</Text>
                            </TouchableOpacity>
                        </View>

                        {showSettings ? (
                            <View className="space-y-4">
                                <Input
                                    label="Party Name"
                                    value={party.name}
                                    onChangeText={(text) => setParty({ ...party, name: text })}
                                />

                                <Input
                                    label="Story Theme"
                                    placeholder="e.g. 1920s Gatsby, Cyberpunk..."
                                    value={theme}
                                    onChangeText={setTheme}
                                />

                                <Input
                                    label="Available Props / Venue Details"
                                    placeholder="Describe the room and available items..."
                                    value={venueDescription}
                                    onChangeText={setVenueDescription}
                                    multiline
                                    numberOfLines={3}
                                />

                                <View>
                                    <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration</Text>
                                    <View className="flex-row gap-2">
                                        {DURATIONS.map(d => (
                                            <TouchableOpacity
                                                key={d}
                                                onPress={() => setDuration(d)}
                                                className={`px-3 py-2 rounded-lg border ${duration === d ? 'bg-indigo-100 border-indigo-500' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}
                                            >
                                                <Text className={`text-xs font-medium ${duration === d ? 'text-indigo-700' : 'text-slate-600 dark:text-slate-400'}`}>{d}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Complexity</Text>
                                    <View className="flex-row gap-2">
                                        {COMPLEXITIES.map(c => (
                                            <TouchableOpacity
                                                key={c}
                                                onPress={() => setComplexity(c)}
                                                className={`px-3 py-2 rounded-lg border ${complexity === c ? 'bg-indigo-100 border-indigo-500' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}
                                            >
                                                <Text className={`text-xs font-medium capitalize ${complexity === c ? 'text-indigo-700' : 'text-slate-600 dark:text-slate-400'}`}>{c}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View className="flex-row flex-wrap gap-2">
                                <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex-row items-center gap-1">
                                    <BookOpen size={12} color="#64748b" />
                                    <Text className="text-xs text-slate-600 dark:text-slate-300">{theme || 'Classic Mystery'}</Text>
                                </View>
                                <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex-row items-center gap-1">
                                    <Clock size={12} color="#64748b" />
                                    <Text className="text-xs text-slate-600 dark:text-slate-300">{duration}</Text>
                                </View>
                                <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex-row items-center gap-1">
                                    <Brain size={12} color="#64748b" />
                                    <Text className="text-xs text-slate-600 dark:text-slate-300 capitalize">{complexity}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Grid */}
                <View className="flex-row flex-wrap gap-4 mb-8">
                    <Link href={`/host/${id}/venue`} asChild>
                        <TouchableOpacity className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 items-center space-y-2">
                            <View className="bg-orange-100 p-3 rounded-full">
                                <MapPin size={24} color="#f97316" />
                            </View>
                            <Text className="font-medium text-slate-900 dark:text-white">Venue</Text>
                        </TouchableOpacity>
                    </Link>

                    {party.status === 'reviewing' ? (
                        <Link href={`/host/${id}/review`} asChild>
                            <TouchableOpacity className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 items-center space-y-2">
                                <View className="bg-green-100 p-3 rounded-full">
                                    <BookOpen size={24} color="#22c55e" />
                                </View>
                                <Text className="font-medium text-slate-900 dark:text-white">Review Mystery</Text>
                            </TouchableOpacity>
                        </Link>
                    ) : party.status === 'active' ? (
                        <Link href={`/host/${id}/game`} asChild>
                            <TouchableOpacity className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 items-center space-y-2">
                                <View className="bg-green-100 p-3 rounded-full">
                                    <Users size={24} color="#22c55e" />
                                </View>
                                <Text className="font-medium text-slate-900 dark:text-white">Active Game</Text>
                            </TouchableOpacity>
                        </Link>
                    ) : (
                        <TouchableOpacity
                            onPress={generateMystery}
                            disabled={generating || guests.length < 3}
                            className={`flex-1 p-4 rounded-xl border items-center space-y-2 ${generating || guests.length < 3
                                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-50'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            {generating ? (
                                <ActivityIndicator size="small" color="#a855f7" />
                            ) : (
                                <View className="bg-purple-100 p-3 rounded-full">
                                    <Sparkles size={24} color="#a855f7" />
                                </View>
                            )}
                            <Text className="font-medium text-slate-900 dark:text-white">
                                {generating ? 'Generating...' : 'Generate'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Guests Section */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white">
                            Guests ({guests.length})
                        </Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity onPress={() => setShowAddGuestModal(true)}>
                                <UserPlus size={20} color="#6366f1" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={shareInvite}>
                                <Share2 size={20} color="#6366f1" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="space-y-3">
                        {guests.map((guest) => (
                            <View key={guest.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className="font-bold text-slate-900 dark:text-white">{guest.name}</Text>
                                        <Text className="text-slate-500 text-xs">PIN: {guest.access_pin}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        {guest.character_id ? (
                                            <View className="bg-green-100 px-2 py-1 rounded">
                                                <Text className="text-green-700 text-xs">Assigned</Text>
                                            </View>
                                        ) : (
                                            <View className="bg-slate-100 px-2 py-1 rounded">
                                                <Text className="text-slate-500 text-xs">Waiting</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity onPress={() => removeGuest(guest.id, guest.name)}>
                                            <Trash2 size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {guests.length === 0 && (
                            <Text className="text-slate-500 text-center py-4">
                                No guests yet. Tap + to add guests!
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Add Guest Modal */}
            <Modal
                visible={showAddGuestModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddGuestModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-12">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Add Guest</Text>
                            <TouchableOpacity onPress={() => setShowAddGuestModal(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4">
                            <Input
                                label="Guest Name"
                                placeholder="Sherlock Holmes"
                                value={newGuestName}
                                onChangeText={setNewGuestName}
                                autoFocus
                            />
                            <Input
                                label="Personality Notes (Optional)"
                                placeholder="Quirky, dramatic, obsessed with details..."
                                value={newGuestNotes}
                                onChangeText={setNewGuestNotes}
                                multiline
                                numberOfLines={3}
                            />
                            <Button
                                title="Add Guest"
                                onPress={addGuest}
                                loading={addingGuest}
                                disabled={!newGuestName.trim()}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

