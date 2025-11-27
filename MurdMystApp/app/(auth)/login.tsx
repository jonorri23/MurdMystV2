import { useState } from 'react';
import { View, Text, Alert, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(tabs)');
        }
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center">
            <View className="space-y-8">
                <View className="items-center space-y-2">
                    <Text className="text-4xl font-bold text-white tracking-tighter">
                        MurdMyst
                    </Text>
                    <Text className="text-slate-400 text-lg">
                        Host the perfect murder mystery
                    </Text>
                </View>

                <View className="space-y-4">
                    <Input
                        label="Email"
                        placeholder="detective@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <Input
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <View className="space-y-4">
                    <Button
                        title="Sign In"
                        onPress={signInWithEmail}
                        loading={loading}
                    />
                    <Link href="/(auth)/signup" asChild>
                        <Button
                            title="Create Account"
                            variant="ghost"
                        />
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
