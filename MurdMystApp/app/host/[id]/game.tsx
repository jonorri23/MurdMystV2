import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, FlatList, Share } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Users, MessageSquare, Bell, Clock, Send, ChevronRight, Copy, Phone } from 'lucide-react-native';
import { PhaseControl } from '../../../components/PhaseControl';
import * as Clipboard from 'expo-clipboard';
import * as SMS from 'expo-sms';

import { ClueControl } from '../../../components/ClueControl';

const TABS = ['Overview', 'Messages', 'Clues', 'Events'];

export default function GameDashboard() {
    const { id } = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState('Overview');
    const [party, setParty] = useState<any>(null);
    const [guests, setGuests] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel(`game-${id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `party_id=eq.${id}` }, (payload) => {
                setMessages(current => [payload.new, ...current]);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
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

        const { data: guestsData } = await supabase
            .from('guests')
            .select('*, characters(*)')
            .eq('party_id', id);

        if (guestsData) setGuests(guestsData);

        const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .eq('party_id', id)
            .order('created_at', { ascending: false });

        if (messagesData) setMessages(messagesData);

        setLoading(false);
    }

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                party_id: id,
                sender_type: 'host',
                sender_id: 'HOST',
                content: newMessage.trim(),
                is_private: false
            });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setNewMessage('');
        }
    };

    const endGame = async () => {
        Alert.alert(
            'End Game',
            'Are you sure you want to end the game? This will reveal the solution to everyone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Game',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase
                            .from('parties')
                            .update({ status: 'completed' })
                            .eq('id', id);
                        router.replace(`/host/${id}/dashboard`);
                    }
                }
            ]
        );
    };

    const copyGameLink = async () => {
        const gameUrl = `https://murdmyst.vercel.app/host/${id}/login`;
        await Clipboard.setStringAsync(gameUrl);
        Alert.alert('Copied!', 'Game link copied to clipboard');
    };

    const sendCharacterSMS = async (guestId: string, characterName: string) => {
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert('SMS Not Available', 'SMS is not available on this device');
            return;
        }

        const characterLink = `https://murdmyst.vercel.app/party/${id}/guest/${guestId}`;
        // For Expo Go testing: exp://192.168.x.x:8081/--/party/${id}/guest/${guestId}
        // For production: Universal link that redirects to app or App Store
        const message = `Welcome to the murder mystery! Access your character (${characterName}) here: ${characterLink}`;

        try {
            await SMS.sendSMSAsync([], message);
        } catch (error) {
            Alert.alert('Error', 'Failed to open SMS app');
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
                <Text className="text-slate-500">Loading game...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <Stack.Screen
                options={{
                    title: party?.name || 'Active Game',
                    headerBackTitle: 'Dashboard',
                    headerRight: () => (
                        <TouchableOpacity onPress={endGame}>
                            <Text className="text-red-500 font-bold">End Game</Text>
                        </TouchableOpacity>
                    )
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

            {activeTab === 'Overview' && (
                <ScrollView className="flex-1 px-6 pt-6">
                    <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
                        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Game in Progress</Text>
                        <Text className="text-slate-500 dark:text-slate-400">
                            Monitor the game, send clues, and track progress.
                        </Text>
                    </View>

                    <View className="mb-8">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Phase Controls</Text>
                        <PhaseControl
                            partyId={id as string}
                            victimName={(party?.victim as any)?.name || 'The Victim'}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={copyGameLink}
                        className="bg-purple-600 p-4 rounded-xl flex-row items-center justify-center mb-8"
                    >
                        <Copy size={20} color="white" />
                        <Text className="text-white font-bold text-base ml-2">Copy Game Link</Text>
                    </TouchableOpacity>

                    <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Guests ({guests.length})</Text>
                    <View className="space-y-3 pb-24">
                        {guests.map(guest => {
                            const character = guest.characters?.[0];
                            return (
                                <View key={guest.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className="flex-1">
                                            <Text className="font-bold text-slate-900 dark:text-white">{guest.name}</Text>
                                            <Text className="text-indigo-500 text-sm">{character?.name}</Text>
                                        </View>
                                        <View className={`w-3 h-3 rounded-full ${guest.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    </View>
                                    {character && (
                                        <TouchableOpacity
                                            onPress={() => sendCharacterSMS(guest.id, character.name)}
                                            className="bg-green-600 p-2 rounded-lg flex-row items-center justify-center mt-2"
                                        >
                                            <Phone size={16} color="white" />
                                            <Text className="text-white font-medium text-sm ml-2">Send Character Link</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            {activeTab === 'Messages' && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                    keyboardVerticalOffset={100}
                >
                    <FlatList
                        data={messages}
                        inverted
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                        renderItem={({ item }) => (
                            <View className={`mb-4 ${item.sender_type === 'host' ? 'items-end' : 'items-start'}`}>
                                <View className={`max-w-[80%] p-3 rounded-2xl ${item.sender_type === 'host'
                                    ? 'bg-indigo-600 rounded-tr-none'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                                    }`}>
                                    {item.sender_type !== 'host' && (
                                        <Text className="text-xs text-slate-500 mb-1">{item.sender_id}</Text>
                                    )}
                                    <Text className={item.sender_type === 'host' ? 'text-white' : 'text-slate-900 dark:text-white'}>
                                        {item.content}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />
                    <View className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-row gap-2">
                        <TextInput
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Send message to all guests..."
                            placeholderTextColor="#94a3b8"
                            className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-slate-900 dark:text-white"
                        />
                        <TouchableOpacity
                            onPress={sendMessage}
                            className="bg-indigo-600 w-12 h-12 rounded-xl items-center justify-center"
                        >
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}

            {activeTab === 'Clues' && (
                <ScrollView className="flex-1 px-6 pt-6">
                    <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-4">Send Clue</Text>
                        <ClueControl partyId={id as string} guests={guests} />
                    </View>
                </ScrollView>
            )}

            {activeTab === 'Events' && (
                <ScrollView className="flex-1 px-6 pt-6">
                    <Text className="text-slate-500 text-center mt-10">No events logged yet.</Text>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
