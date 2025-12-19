import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Image, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ui/Text/ThemedText';
import { ThemedView } from '@/components/ui/Views/ThemedView';
import { IUserPlant, IUserPlantMerged } from '@/constants/IPlant';
import useMergedPlant from '@/hooks/plants/useMergedPlant';
import { useTheme } from '@/hooks/utils/useTheme';
import { getWateringProgress } from '@/helpers/plants/wateringProgress';
import { getUrgencyColor } from './WateringPrediction';

interface PlantCardProps {
    plant: IUserPlant | IUserPlantMerged;
    onPress: () => void;
    onDelete: (plant: IUserPlant | IUserPlantMerged) => void;
}

const PlantCard = ({ plant, onPress, onDelete }: PlantCardProps) => {
    const { colors } = useTheme();
    const { mergedPlant } = useMergedPlant(plant);

    const displayName = plant.custom_name || mergedPlant?.name || "Unnamed Plant";
    const imageUri = (plant as IUserPlantMerged).images?.[0] || mergedPlant?.images?.[0] || null;
    const { status, progressPercent } = getWateringProgress(plant, mergedPlant);
    const urgencyColor = getUrgencyColor(status.urgency, colors);

    return (
        <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: colors.card }]}>
            <ThemedView style={styles.mainContent}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.image} />
                ) : (
                    <Ionicons name="leaf-outline" size={80} color={colors.icon} style={styles.image} />
                )}
                <ThemedView style={styles.infoContainer}>
                    <ThemedText style={styles.plantName}>{displayName}</ThemedText>
                </ThemedView>
                <Pressable accessibilityLabel="Delete" accessibilityRole="button" onPress={() => onDelete(plant)}>
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                </Pressable>
            </ThemedView>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: progressPercent, backgroundColor: urgencyColor }]} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 15,
        padding: 10,
        gap: 8,
        marginBottom: 10,
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 12,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 10,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    plantName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    progressTrack: {
        height: 6,
        width: '100%',
        borderRadius: 99,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 99,
    },
});

export default PlantCard;
