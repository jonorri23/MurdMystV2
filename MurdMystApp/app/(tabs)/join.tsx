import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function JoinParty() {
    const [gameId, setGameId] = useState('');
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    async function joinParty() {
        // If Game ID is provided, use it to find the guest
        if (gameId && pin) {
            setLoading(true);

            const { data: guests, error } = await supabase
                .from('guests')
                .select('id, party_id, name')
                .eq('party_id', gameId)
                .eq('access_pin', pin)
                .single();

            if (error || !guests) {
                Alert.alert('Error', 'Invalid Game ID or PIN');
                setLoading(false);
                return;
            }

            router.replace(`/party/${guests.party_id}/guest/${guests.id}`);
            setLoading(false);
            return;
        }

        // Legacy flow: just PIN (search across all parties)
        if (!pin || !name) {
            Alert.alert('Error', 'Please enter your PIN (and optionally Game ID for direct access)');
            return;
        }

        setLoading(true);

        const { data: guests, error } = await supabase
            .from('guests')
            .select('id, party_id, name')
            .eq('access_pin', pin);

        if (error) {
            Alert.alert('Error', error.message);
            setLoading(false);
            return;
        }

        if (!guests || guests.length === 0) {
            Alert.alert('Error', 'Invalid PIN. Please ask your host for the correct code.');
            setLoading(false);
            return;
        }

        const guest = guests[0];
        router.replace(`/party/${guest.party_id}/guest/${guest.id}`);
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 px-6 justify-center">
            <View className="space-y-8">
                <View>
                    <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                        Join Party
                    </Text>
                    <Text className="text-slate-500 mt-2">
                        Enter Game ID and PIN for direct access, or just PIN to search.
                    </Text>
                </View>

                <View className="space-y-4">
                    <Input
                        label="Game ID (Optional)"
                        placeholder="abc123def456"
                        value={gameId}
                        onChangeText={setGameId}
                        autoCapitalize="none"
                    />
                    <Input
                        label="Access PIN"
                        placeholder="1234"
                        value={pin}
                        onChangeText={setPin}
                        keyboardType="number-pad"
                        maxLength={4}
                    />
                    <Input
                        label="Your Name (if PIN only)"
                        placeholder="Sherlock Holmes"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <Button
                    title="Enter Mystery"
                    onPress={joinParty}
                    loading={loading}
                />
            </View>
        </SafeAreaView>
    );
}
