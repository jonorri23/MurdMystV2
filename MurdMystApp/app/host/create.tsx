import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function CreateParty() {
    const [name, setName] = useState('');
    const [theme, setTheme] = useState('');
    const [loading, setLoading] = useState(false);

    async function createParty() {
        if (!name) {
            Alert.alert('Error', 'Party name is required');
            return;
        }

        setLoading(true);

        // Generate a random host PIN
        const hostPin = Math.floor(1000 + Math.random() * 9000).toString();

        const { data, error } = await supabase
            .from('parties')
            .insert([
                {
                    name,
                    story_theme: theme || 'Classic Murder Mystery',
                    host_pin: hostPin,
                    status: 'planning'
                }
            ])
            .select()
            .single();

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace(`/host/${data.id}/dashboard`);
        }
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <Stack.Screen options={{ title: 'Create Party', headerBackTitle: 'Back' }} />

            <ScrollView className="flex-1 px-6 pt-6">
                <View className="space-y-6">
                    <View>
                        <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                            New Mystery
                        </Text>
                        <Text className="text-slate-500 mt-2">
                            Give your party a name and a theme to get started.
                        </Text>
                    </View>

                    <View className="space-y-4">
                        <Input
                            label="Party Name"
                            placeholder="The Manor Mystery"
                            value={name}
                            onChangeText={setName}
                        />
                        <Input
                            label="Theme (Optional)"
                            placeholder="1920s Jazz Age"
                            value={theme}
                            onChangeText={setTheme}
                        />
                    </View>

                    <Button
                        title="Create Party"
                        onPress={createParty}
                        loading={loading}
                        className="mt-4"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
