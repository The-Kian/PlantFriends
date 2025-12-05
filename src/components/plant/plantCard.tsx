import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/utils/useTheme';
import { IPlant } from '@/constants/IPlant';
import ThemedButton from '@/components/ui/Buttons/ThemedButton';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ui/Views/ThemedView';
import { ThemedText } from '@/components/ui/Text/ThemedText';

interface PlantCardProps {
    plant: IPlant;
    onPress: () => void;
    onDelete: (plant: IPlant) => void;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, onPress, onDelete }) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: colors.tint }]}>
            {plant.images && plant.images.length > 0 ? (
                <Image source={{ uri: plant.images[0] }} style={styles.image} />
            ) : (
                <Ionicons name="leaf-outline" size={80} color={colors.icon} style={styles.image} />
            )}
            <ThemedView style={styles.infoContainer}>
                <ThemedText style={[styles.plantName, { color: colors.text }]}>{plant.name || "Unnamed Plant"}</ThemedText>
            </ThemedView >
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
        marginLeft: 15,
        justifyContent: 'center',
    },
    plantName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    plantPrice: {
        fontSize: 16,
        marginTop: 5,
    },
});

export default PlantCard;
