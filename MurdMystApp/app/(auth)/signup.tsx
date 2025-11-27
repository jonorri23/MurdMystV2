import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Please check your inbox for email verification!');
            router.replace('/(auth)/login');
        }
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center">
            <View className="space-y-8">
                <View className="items-center space-y-2">
                    <Text className="text-3xl font-bold text-white tracking-tighter">
                        Create Account
                    </Text>
                    <Text className="text-slate-400 text-base text-center">
                        Join the mystery and start hosting unforgettable parties
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
                        title="Sign Up"
                        onPress={signUpWithEmail}
                        loading={loading}
                    />
                    <Link href="/(auth)/login" asChild>
                        <Button
                            title="Already have an account? Sign In"
                            variant="ghost"
                        />
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
