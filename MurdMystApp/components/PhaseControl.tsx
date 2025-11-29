import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Utensils, Skull, Scale } from 'lucide-react-native';

interface PhaseControlProps {
    partyId: string;
    victimName: string;
}

export function PhaseControl({ partyId, victimName }: PhaseControlProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const broadcast = async (phase: string, message: string) => {
        Alert.alert(
            `Start ${phase}?`,
            `This will broadcast: "${message}"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Broadcast',
                    onPress: async () => {
                        setLoading(phase);
                        try {
                            const { error } = await supabase
                                .from('game_events')
                                .insert([
                                    {
                                        party_id: partyId,
                                        event_type: 'clue',
                                        content: message,
                                        trigger_time: new Date().toISOString(),
                                        target_guest_ids: null, // Broadcast to all
                                    }
                                ]);

                            if (error) throw error;
                            Alert.alert('Success', `${phase} announced!`);
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setLoading(null);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="space-y-3">
            <TouchableOpacity
                onPress={() => broadcast('Dinner', "🍽️ DINNER IS SERVED! Please take your seats. Remember to stay in character and complete your opening actions.")}
                disabled={!!loading}
                className="p-4 bg-blue-900/20 border border-blue-800 rounded-xl flex-row items-center space-x-4"
            >
                <View className="bg-blue-900/50 p-3 rounded-full">
                    {loading === 'Dinner' ? <ActivityIndicator color="#60a5fa" /> : <Utensils size={24} color="#60a5fa" />}
                </View>
                <View className="flex-1">
                    <Text className="text-blue-400 font-bold text-lg mb-1">1. Start Dinner</Text>
                    <Text className="text-slate-400 text-xs">Broadcasts dinner announcement. Encourages opening actions.</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => broadcast('Murder', `💀 A MURDER HAS OCCURRED! ${victimName} has been found dead! Everyone freeze and check your devices for clues.`)}
                disabled={!!loading}
                className="p-4 bg-red-900/20 border border-red-800 rounded-xl flex-row items-center space-x-4"
            >
                <View className="bg-red-900/50 p-3 rounded-full">
                    {loading === 'Murder' ? <ActivityIndicator color="#f87171" /> : <Skull size={24} color="#f87171" />}
                </View>
                <View className="flex-1">
                    <Text className="text-red-400 font-bold text-lg mb-1">2. Announce Murder</Text>
                    <Text className="text-slate-400 text-xs">Triggers the investigation phase. Reveals the victim.</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => broadcast('Accusations', "⚖️ THE TIME HAS COME! Gather round to present your evidence and accuse the killer.")}
                disabled={!!loading}
                className="p-4 bg-purple-900/20 border border-purple-800 rounded-xl flex-row items-center space-x-4"
            >
                <View className="bg-purple-900/50 p-3 rounded-full">
                    {loading === 'Accusations' ? <ActivityIndicator color="#c084fc" /> : <Scale size={24} color="#c084fc" />}
                </View>
                <View className="flex-1">
                    <Text className="text-purple-400 font-bold text-lg mb-1">3. Start Accusations</Text>
                    <Text className="text-slate-400 text-xs">Calls everyone together for the final resolution.</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}
