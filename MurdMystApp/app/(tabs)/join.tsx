import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function JoinParty() {
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    async function joinParty() {
        if (!pin || !name) {
            Alert.alert('Error', 'Please enter both PIN and your name');
            return;
        }

        setLoading(true);

        // 1. Find party by PIN (actually guest PIN is unique per guest usually, but here we might mean Party PIN? 
        // In the web app, guests join via a link or Party ID + Name.
        // Let's assume the PIN is the Guest Access PIN if they are re-joining, 
        // OR if they are new, they need a Party Code?
        // The web app `joinParty` action takes `partyId`, `name`, `personality`, `accessPin`.
        // It seems the host adds guests first, then guests join with their PIN?
        // Or guests self-register?
        // In `addGuest` action: host adds guest, generates PIN.
        // So guest needs to know their PIN.

        // Let's assume this screen is for "I have a PIN, let me in".
        // We need to find the guest by PIN across all parties? Or ask for Party ID too?
        // PINs are 4 digits, so collisions are likely across the whole DB.
        // But maybe unique within a party.

        // Let's try to find a guest with this PIN.
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

        // If multiple guests have same PIN (rare but possible), we might need name to disambiguate
        // or just pick the first one for now.
        const guest = guests[0];

        // Save session (simple async storage for now)
        // In a real app we'd use a more robust auth or context

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
                        Enter your access code to enter the mystery.
                    </Text>
                </View>

                <View className="space-y-4">
                    <Input
                        label="Your Name"
                        placeholder="Sherlock Holmes"
                        value={name}
                        onChangeText={setName}
                    />
                    <Input
                        label="Access PIN"
                        placeholder="1234"
                        value={pin}
                        onChangeText={setPin}
                        keyboardType="number-pad"
                        maxLength={4}
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
