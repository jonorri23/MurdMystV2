import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Send } from 'lucide-react-native';

interface Guest {
    id: string;
    name: string;
    characters: any[];
}

interface ClueControlProps {
    partyId: string;
    guests: Guest[];
    onClueSent?: () => void;
}

export function ClueControl({ partyId, guests, onClueSent }: ClueControlProps) {
    const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
    const [sendToAll, setSendToAll] = useState(true);
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    const toggleGuest = (guestId: string) => {
        if (selectedGuests.includes(guestId)) {
            const newSelected = selectedGuests.filter(id => id !== guestId);
            setSelectedGuests(newSelected);
            if (newSelected.length === 0) {
                setSendToAll(true);
            }
        } else {
            setSelectedGuests([...selectedGuests, guestId]);
        }
    };

    const toggleAll = () => {
        if (sendToAll) {
            setSendToAll(false);
            setSelectedGuests([]);
        } else {
            setSendToAll(true);
            setSelectedGuests([]);
        }
    };

    const handleSend = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please enter a clue or message');
            return;
        }

        if (!sendToAll && selectedGuests.length === 0) {
            Alert.alert('Error', 'Please select at least one guest');
            return;
        }

        setSending(true);
        try {
            const targetGuestIds = sendToAll ? null : JSON.stringify(selectedGuests);

            const { error } = await supabase
                .from('game_events')
                .insert([
                    {
                        party_id: partyId,
                        event_type: 'clue',
                        content: content.trim(),
                        trigger_time: new Date().toISOString(),
                        target_guest_ids: targetGuestIds,
                    }
                ]);

            if (error) throw error;

            setContent('');
            setSendToAll(true);
            setSelectedGuests([]);
            Alert.alert('Success', 'Clue sent successfully!');
            onClueSent?.();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send clue');
        } finally {
            setSending(false);
        }
    };

    return (
        <View className="space-y-4">
            {/* Recipient Selection */}
            <View>
                <Text className="text-sm font-medium text-slate-300 mb-2">Send To:</Text>
                <View className="flex-row flex-wrap gap-2">
                    <TouchableOpacity
                        onPress={toggleAll}
                        className={`px-3 py-1.5 rounded-full border ${sendToAll
                            ? 'bg-purple-600 border-purple-500'
                            : 'bg-slate-800 border-slate-700'
                            }`}
                    >
                        <Text className={`text-xs font-medium ${sendToAll ? 'text-white' : 'text-slate-400'}`}>
                            All Guests
                        </Text>
                    </TouchableOpacity>

                    {guests.map((guest) => {
                        const char = guest.characters?.[0];
                        const isSelected = selectedGuests.includes(guest.id);
                        return (
                            <TouchableOpacity
                                key={guest.id}
                                onPress={() => {
                                    setSendToAll(false);
                                    toggleGuest(guest.id);
                                }}
                                className={`px-3 py-1.5 rounded-full border ${isSelected
                                    ? 'bg-purple-600 border-purple-500'
                                    : 'bg-slate-800 border-slate-700'
                                    }`}
                            >
                                <Text className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                    {char?.name || guest.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Message Input */}
            <View>
                <View className="flex-row gap-2">
                    <TextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder="Type a clue or announcement..."
                        placeholderTextColor="#64748b"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm"
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={sending}
                        className={`bg-purple-600 justify-center items-center px-4 rounded-xl ${sending ? 'opacity-50' : ''}`}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Send size={20} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
                <Text className="text-xs text-slate-500 mt-2 ml-1">
                    {sendToAll
                        ? `Sending to all ${guests.length} guests`
                        : `Sending to ${selectedGuests.length} selected guest${selectedGuests.length !== 1 ? 's' : ''}`}
                </Text>
            </View>
        </View>
    );
}
