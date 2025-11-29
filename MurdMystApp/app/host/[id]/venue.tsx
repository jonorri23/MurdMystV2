import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Camera, Upload, Trash2, Wand2, Image as ImageIcon, Sparkles, AlertTriangle, Edit2, Save } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';

export default function VenueAnalysis() {
    const { id } = useLocalSearchParams();
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartyData = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from('parties')
                .select('venue_analysis, setting_description')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching party data:', error);
                Alert.alert('Error', 'Could not load party data.');
            } else if (data) {
                if (data.venue_analysis) {
                    setAnalysisResult(data.venue_analysis);
                }
                setEditedDescription(data.setting_description || '');
            }
            setLoading(false);
        };

        fetchPartyData();
    }, [id]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.5,
            base64: true,
            allowsEditing: false, // Multi-select doesn't support editing, but we can resize
        });

        if (!result.canceled) {
            setImages([...images, ...result.assets]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const saveDescription = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('parties')
            .update({ setting_description: editedDescription })
            .eq('id', id);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setIsEditing(false);
            Alert.alert('Success', 'Venue description updated!');
        }
        setSaving(false);
    };

    const analyzeVenue = async () => {
        if (images.length === 0) {
            Alert.alert('No images', 'Please select at least one image of the venue.');
            return;
        }

        setUploading(true);
        const uploadedUrls: string[] = [];

        try {
            // 1. Upload images
            for (const image of images) {
                if (!image.base64) continue;

                const fileName = `venue-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                const filePath = `${id}/${fileName}`;
                const fileData = decode(image.base64);

                let bucket = 'venue_images';

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, fileData, {
                        contentType: 'image/jpeg',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Upload error (venue_images), trying portraits:', uploadError);
                    // Fallback to portraits bucket (matching web app logic)
                    bucket = 'portraits';
                    const { error: retryError } = await supabase.storage
                        .from(bucket)
                        .upload(filePath, fileData, {
                            contentType: 'image/jpeg',
                            upsert: false
                        });

                    if (retryError) {
                        console.error('Upload failed for both buckets:', retryError);
                        Alert.alert(
                            'Upload Failed',
                            `Could not upload image: ${uploadError.message}`
                        );
                        throw uploadError;
                    }
                }

                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
                console.log('Uploaded image URL:', publicUrl);
            }

            setAnalyzing(true);

            // 2. Call Edge Function
            const { data, error } = await supabase.functions.invoke('analyze-venue', {
                body: {
                    partyId: id,
                    imageUrls: uploadedUrls
                }
            });

            if (error) {
                console.error('analyzeVenue error:', error);
                throw error;
            }

            console.log('Analysis complete:', data);
            setAnalysisResult(data.analysis);
            setEditedDescription(data.analysis.setting_description || ''); // Update description from analysis
            Alert.alert('Success', 'Venue analyzed successfully!');

        } catch (error: any) {
            console.error('Process failed:', error);
            Alert.alert('Error', error.message || 'Failed to analyze venue');
        } finally {
            setUploading(false);
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-4 text-slate-700 dark:text-slate-300">Loading venue data...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <Stack.Screen options={{ title: 'Venue Analysis', headerBackTitle: 'Dashboard' }} />

            <ScrollView className="flex-1 p-6">
                <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">Upload Venue Photos</Text>
                    <Text className="text-slate-500 dark:text-slate-400 mb-4">
                        Take photos of the room where the party will happen. The AI will identify hiding spots and objects.
                    </Text>

                    <View className="flex-row gap-4 mb-4">
                        <Button
                            title="Add Photos"
                            onPress={pickImage}
                            variant="outline"
                            icon={<Camera size={20} color="#6366f1" />}
                            className="flex-1"
                        />
                    </View>

                    {/* Image Grid */}
                    <View className="flex-row flex-wrap gap-2">
                        {images.map((img, index) => (
                            <View key={index} className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <Image source={{ uri: img.uri }} className="w-full h-full" resizeMode="cover" />
                                <TouchableOpacity
                                    onPress={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
                                >
                                    <Trash2 size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {images.length > 0 && (
                    <Button
                        title={uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Analyze Venue'}
                        onPress={analyzeVenue}
                        loading={uploading || analyzing}
                        icon={!uploading && !analyzing ? <Wand2 size={20} color="white" /> : undefined}
                        className="mb-8"
                    />
                )}

                {/* Results Preview */}
                {analysisResult && (
                    <View className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            Analysis Result
                        </Text>

                        <View className="space-y-4">
                            <View>
                                <Text className="font-medium text-slate-500 text-xs uppercase">Atmosphere</Text>
                                <Text className="text-slate-900 dark:text-white">{analysisResult.atmosphere}</Text>
                            </View>

                            <View>
                                <Text className="font-medium text-slate-500 text-xs uppercase">Hiding Spots</Text>
                                {analysisResult.hidingSpots?.map((spot: any, i: number) => (
                                    <Text key={i} className="text-slate-900 dark:text-white mt-1">
                                        • {spot.object}: {spot.specificLocation} ({spot.difficulty})
                                    </Text>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Editable Description */}
                {analysisResult && (
                    <View className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-8 rounded-2xl">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white">Venue Description</Text>
                            {isEditing ? (
                                <TouchableOpacity onPress={saveDescription} disabled={saving}>
                                    {saving ? <ActivityIndicator size="small" color="#6366f1" /> : <Save size={20} color="#6366f1" />}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={() => setIsEditing(true)}>
                                    <Edit2 size={20} color="#6366f1" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {isEditing ? (
                            <TextInput
                                value={editedDescription}
                                onChangeText={setEditedDescription}
                                multiline
                                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white min-h-[100px] border border-indigo-200 dark:border-indigo-900"
                                textAlignVertical="top"
                            />
                        ) : (
                            <View className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                <Text className="text-slate-700 dark:text-slate-300 leading-6">
                                    {editedDescription || `A ${analysisResult.atmosphere} ${analysisResult.roomType}.`}
                                </Text>

                                <View className="mt-4 flex-row flex-wrap gap-2">
                                    {analysisResult.keyObjects?.map((obj: any, i: number) => (
                                        <View key={i} className="bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded">
                                            <Text className="text-xs text-indigo-700 dark:text-indigo-300">{obj.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
