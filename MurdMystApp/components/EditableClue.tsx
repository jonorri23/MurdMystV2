import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Edit2, Key, Lock, MapPin } from 'lucide-react-native';

interface Clue {
    description: string;
    content: string;
    setupInstruction: string;
    timing: string;
    hasUnlockCode?: boolean;
    unlockCode?: string;
    [key: string]: any;
}

interface EditableClueProps {
    clue: Clue;
    index: number;
    onSave: (updatedClue: Clue, index: number) => Promise<void>;
}

export function EditableClue({ clue, index, onSave }: EditableClueProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ ...clue });

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(formData, index);
            setIsEditing(false);
            Alert.alert('Success', 'Clue updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update clue');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
            <View className="flex-row items-center gap-3 mb-3">
                <View className="bg-orange-100 p-2 rounded-full">
                    <Key size={20} color="#f97316" />
                </View>
                <View className="flex-1">
                    <Text className="font-bold text-slate-900 dark:text-white">{clue.description}</Text>
                    <Text className="text-orange-600 text-xs font-medium uppercase">{clue.timing}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditing(true)} className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <Edit2 size={16} color="#6366f1" />
                </TouchableOpacity>
            </View>

            <View className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mb-3">
                <Text className="text-xs font-bold text-slate-500 uppercase mb-1">Setup Instruction</Text>
                <Text className="text-slate-700 dark:text-slate-300 text-sm">{clue.setupInstruction}</Text>
            </View>

            <View className="border-l-4 border-slate-300 dark:border-slate-700 pl-3 py-1 mb-3">
                <Text className="text-slate-600 dark:text-slate-400 italic">"{clue.content}"</Text>
            </View>

            {clue.hasUnlockCode && (
                <View className="flex-row items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg">
                    <Lock size={14} color="#6366f1" />
                    <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">PIN Code:</Text>
                    <Text className="text-indigo-700 dark:text-indigo-300 font-mono font-bold">{clue.unlockCode}</Text>
                </View>
            )}

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
                        <Text className="text-white font-bold text-lg">Edit Clue</Text>
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
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Description</Text>
                                <TextInput
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Timing</Text>
                                <TextInput
                                    value={formData.timing}
                                    onChangeText={(text) => setFormData({ ...formData, timing: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800"
                                    placeholder="e.g. Before Dinner"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Setup Instruction</Text>
                                <TextInput
                                    value={formData.setupInstruction}
                                    onChangeText={(text) => setFormData({ ...formData, setupInstruction: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 h-24"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Clue Content</Text>
                                <TextInput
                                    value={formData.content}
                                    onChangeText={(text) => setFormData({ ...formData, content: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 h-32"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            {formData.hasUnlockCode && (
                                <View>
                                    <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Unlock Code</Text>
                                    <TextInput
                                        value={formData.unlockCode}
                                        onChangeText={(text) => setFormData({ ...formData, unlockCode: text })}
                                        className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800"
                                        keyboardType="numeric"
                                    />
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
