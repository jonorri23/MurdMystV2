import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Edit2, Save, X, Sparkles, User, Scroll, Target } from 'lucide-react-native';

interface EditableCharacterProps {
    character: any;
    onUpdate: () => void;
}

export function EditableCharacter({ character, onUpdate }: EditableCharacterProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: character.name,
        role: character.role,
        backstory: character.backstory,
        secret_objective: character.secret_objective,
        opening_action: character.opening_action || '',
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('characters')
                .update(formData)
                .eq('id', character.id);

            if (error) throw error;

            setIsEditing(false);
            onUpdate();
            Alert.alert('Success', 'Character updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const isMurderer = character.secret_objective?.includes('MURDERER');

    return (
        <View className={`bg-slate-900 border rounded-xl p-4 mb-4 ${isMurderer ? 'border-red-900/50' : 'border-slate-800'}`}>
            {/* View Mode Header */}
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-2">
                    <Text className="text-lg font-bold text-white">{character.name}</Text>
                    <Text className="text-slate-400 text-sm">{character.role}</Text>
                </View>
                <View className="flex-row gap-2">
                    {isMurderer && (
                        <View className="bg-red-900/30 px-2 py-1 rounded">
                            <Text className="text-red-400 text-xs font-bold">Murderer</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={() => setIsEditing(true)}
                        className="bg-purple-600 p-2 rounded-lg"
                    >
                        <Edit2 size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* View Mode Details */}
            <View className="space-y-3">
                {character.opening_action && (
                    <View className="bg-yellow-900/20 border-l-2 border-yellow-600 pl-3 py-2 rounded-r">
                        <Text className="text-xs font-bold text-yellow-500 uppercase mb-1">Opening Action</Text>
                        <Text className="text-yellow-200 text-sm">{character.opening_action}</Text>
                    </View>
                )}

                <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-1">Backstory</Text>
                    <Text className="text-slate-300 text-sm leading-relaxed" numberOfLines={3}>{character.backstory}</Text>
                </View>

                <View className="bg-red-900/10 border border-red-900/30 rounded p-3">
                    <Text className="text-xs font-bold text-red-500 uppercase mb-1">Secret Objective</Text>
                    <Text className="text-red-200 text-sm">{character.secret_objective}</Text>
                </View>
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
                        <Text className="text-white font-bold text-lg">Edit Character</Text>
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
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Name</Text>
                                <TextInput
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Role</Text>
                                <TextInput
                                    value={formData.role}
                                    onChangeText={(text) => setFormData({ ...formData, role: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Opening Action</Text>
                                <TextInput
                                    value={formData.opening_action}
                                    onChangeText={(text) => setFormData({ ...formData, opening_action: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800"
                                    placeholder="E.g. Ask for a specific song..."
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Backstory</Text>
                                <TextInput
                                    value={formData.backstory}
                                    onChangeText={(text) => setFormData({ ...formData, backstory: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 h-32"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Secret Objective</Text>
                                <TextInput
                                    value={formData.secret_objective}
                                    onChangeText={(text) => setFormData({ ...formData, secret_objective: text })}
                                    className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 h-24"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
