import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, PartyPopper, ChevronRight, LogOut } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export default function Dashboard() {
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/(auth)/login');
      } else {
        setIsAuthenticated(true);
        fetchParties();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/(auth)/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchParties() {
    // In a real app, we'd filter by user ID. 
    // For MVP, we'll just fetch all parties or use local storage to track "my" parties.
    // Or better, since we have RLS, just fetch all and Supabase filters it.
    // But we haven't set up RLS for the user yet in the migration.
    // Let's assume we fetch all for now or implement a simple filter if we had user ID.

    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setParties(data);
    }
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchParties();
  };

  const createInstantParty = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    const hostPin = Math.floor(1000 + Math.random() * 9000).toString();

    const { data, error } = await supabase
      .from('parties')
      .insert([
        {
          host_id: user.id,
          name: 'New Mystery Party',
          status: 'planning',
          host_pin: hostPin,
        }
      ])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      router.push(`/host/${data.id}/dashboard`);
    }
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

  if (!isAuthenticated) {
    return null; // Show nothing while redirecting
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          My Parties
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={createInstantParty} className="bg-indigo-600 p-2 rounded-full">
            <Plus color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} className="p-2">
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={parties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-12 space-y-4">
              <PartyPopper size={48} color="#94a3b8" />
              <Text className="text-slate-500 text-center">
                No parties yet. Start hosting!
              </Text>
              <Button
                title={loading ? "Creating..." : "Create Party"}
                onPress={createInstantParty}
                loading={loading}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Link href={`/host/${item.id}/dashboard`} asChild>
            <TouchableOpacity className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.name}
                </Text>
                <Text className="text-slate-500 text-sm">
                  {item.status.toUpperCase()} • {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
          </Link>
        )}
      />
    </SafeAreaView >
  );
}
