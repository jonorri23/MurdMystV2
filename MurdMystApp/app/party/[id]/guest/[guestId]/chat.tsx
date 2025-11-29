import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, User } from 'lucide-react-native';
import { supabase } from '../../../../../lib/supabase';

export default function GuestChat() {
    const { id: partyId, guestId } = useLocalSearchParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [guestName, setGuestName] = useState('');
    const [characterName, setCharacterName] = useState('');

    useEffect(() => {
        fetchData();

        const subscription = supabase
            .channel(`chat-${partyId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `party_id=eq.${partyId}` }, (payload) => {
                setMessages(current => [payload.new, ...current]);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [partyId]);

    async function fetchData() {
        // Get my details first
        const { data: guestData } = await supabase
            .from('guests')
            .select('*, characters(*)')
            .eq('id', guestId)
            .single();

        if (guestData) {
            setGuestName(guestData.name);
            setCharacterName(guestData.characters?.[0]?.name || '');
        }

        const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .eq('party_id', partyId)
            .order('created_at', { ascending: false });

        if (messagesData) setMessages(messagesData);
        setLoading(false);
    }

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        const { error } = await supabase
            .from('messages')
            .insert({
                party_id: partyId,
                sender_type: 'guest',
                sender_id: guestId, // In a real app, use the character name or ID if preferred
                content: content,
                is_private: false
            });

        if (error) {
            Alert.alert('Error', 'Failed to send message');
            setNewMessage(content); // Restore if failed
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-slate-950">
                <ActivityIndicator size="large" color="#a855f7" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            <Stack.Screen options={{
                title: 'Party Chat',
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#fff',
                headerBackTitle: 'Back'
            }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={100}
            >
                <FlatList
                    data={messages}
                    inverted
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                    renderItem={({ item }) => {
                        const isMe = item.sender_id === guestId;
                        const isHost = item.sender_type === 'host';

                        return (
                            <View className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                                <View className={`max-w-[80%] p-3 rounded-2xl ${isMe
                                        ? 'bg-purple-600 rounded-tr-none'
                                        : isHost
                                            ? 'bg-indigo-900 border border-indigo-700 rounded-tl-none'
                                            : 'bg-slate-800 rounded-tl-none'
                                    }`}>
                                    {!isMe && (
                                        <Text className={`text-xs mb-1 font-bold ${isHost ? 'text-indigo-300' : 'text-slate-400'}`}>
                                            {isHost ? 'HOST' : (item.sender_name || 'Guest')}
                                            {/* Note: sender_name might not be in the table, we might need to join or fetch. 
                                                For MVP, sender_id is the guest ID. We'd ideally want the name. 
                                                Let's assume for now we just show "Guest" or ID if not me/host. 
                                                To fix this properly we need to fetch sender names or store them.
                                            */}
                                        </Text>
                                    )}
                                    <Text className="text-white text-base">
                                        {item.content}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />

                <View className="p-4 bg-slate-900 border-t border-slate-800 flex-row gap-3 items-center">
                    <TextInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder={`Message as ${characterName || guestName}...`}
                        placeholderTextColor="#64748b"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-3 text-white"
                        returnKeyType="send"
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={!newMessage.trim()}
                        className={`w-12 h-12 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-purple-600' : 'bg-slate-800'
                            }`}
                    >
                        <Send size={20} color={newMessage.trim() ? '#fff' : '#475569'} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
