import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Edit2, MessageSquare, Clock } from 'lucide-react-native';

interface GameEvent {
    id: string;
    content: string;
    trigger_time: string;
    event_type: string;
    [key: string]: any;
}

interface EditableGameEventProps {
    event: GameEvent;
    onUpdate: () => void;
}

export function EditableGameEvent({ event, onUpdate }: EditableGameEventProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        content: event.content,
        trigger_time: event.trigger_time,
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('game_events')
                .update(formData)
                .eq('id', event.id);

            if (error) throw error;

            setIsEditing(false);
            onUpdate();
            Alert.alert('Success', 'Event updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
            <View className="flex-row items-center gap-3 mb-3">
                <View className="bg-indigo-100 p-2 rounded-full">
                    <MessageSquare size={20} color="#6366f1" />
                </View>
                <View className="flex-1">
                    <Text className="font-bold text-slate-900 dark:text-white">In-App Clue</Text>
                    <Text className="text-slate-500 text-xs">
                        {new Date(event.trigger_time).toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditing(true)} className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <Edit2 size={16} color="#6366f1" />
                </TouchableOpacity>
            </View>

            <View className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <Text className="text-slate-700 dark:text-slate-300 italic">"{event.content}"</Text>
            </View>

            {/* Edit Modal */}
            <Modal
                visible={isEditing}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View className="flex-1 bg-slate-950">
                    <View className="flex-row justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
                        <TouchableOpacity onPress={() => setIsEditing(false)}>
                            <Text className="text-slate-400 text-lg">Cancel</Text>
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-lg">Edit Event</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving ? (
                                <ActivityIndicator color="#a855f7" />
                            ) : (
                                <Text className="text-purple-500 font-bold text-lg">Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-4">
                        <View className="space-y-4 pb-10">
                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Content</Text>
                                <TextInput
                                    value={formData.content}
                                    onChangeText={(text) => setFormData({ ...formData, content: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 h-32"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Trigger Time (ISO)</Text>
                                <TextInput
                                    value={formData.trigger_time}
                                    onChangeText={(text) => setFormData({ ...formData, trigger_time: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800"
                                    placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
                                />
                                <Text className="text-slate-500 text-xs mt-1">
                                    Format: YYYY-MM-DDTHH:mm:ss.sssZ
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
