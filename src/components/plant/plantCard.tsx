import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Image, StyleSheet, TouchableOpacity } from 'react-native';

import ThemedButton from '@/components/ui/Buttons/ThemedButton';
import { ThemedText } from '@/components/ui/Text/ThemedText';
import { ThemedView } from '@/components/ui/Views/ThemedView';
import { IUserPlant, IUserPlantMerged } from '@/constants/IPlant';
import useMergedPlant from '@/hooks/plants/useMergedPlant';
import { useTheme } from '@/hooks/utils/useTheme';

interface PlantCardProps {
    plant: IUserPlant | IUserPlantMerged;
    onPress: () => void;
    onDelete: (plant: IUserPlant | IUserPlantMerged) => void;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, onPress, onDelete }) => {
    const { colors } = useTheme();
    const { mergedPlant } = useMergedPlant(plant);

    const displayName = plant.custom_name || mergedPlant?.name || "Unnamed Plant";
    const imageUri = (plant as IUserPlantMerged).images?.[0] || mergedPlant?.images?.[0] || null;

    return (
        <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: colors.card }]}>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
                <Ionicons name="leaf-outline" size={80} color={colors.icon} style={styles.image} />
            )}
            <ThemedView style={styles.infoContainer}>
                <ThemedText style={styles.plantName}>{displayName}</ThemedText>
            </ThemedView>
            <ThemedButton
                title="Delete"
                onPress={() => onDelete(plant)}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 15,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
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
});

export default PlantCard;
