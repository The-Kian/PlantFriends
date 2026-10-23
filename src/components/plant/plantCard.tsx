import { Ionicons } from '@expo/vector-icons';
import React, { useContext } from 'react';

import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/Text/ThemedText';
import { IUserPlant, IUserPlantMerged } from '@/constants/IPlant';
import { AuthContext } from '@/context/auth/AuthProvider';
import { useHousehold } from '@/context/household/HouseholdProvider';
import { getWateringProgress } from '@/helpers/plants/wateringProgress';
import useMergedPlant from '@/hooks/plants/useMergedPlant';
import { useTheme } from '@/hooks/utils/useTheme';

import { formatLastWatered, getUrgencyColor } from '../watering/WateringPrediction';

interface PlantCardProps {
    plant: IUserPlant | IUserPlantMerged;
    onPress: () => void;
    onDelete: (plant: IUserPlant | IUserPlantMerged) => void;
}

const PlantCard = ({ plant, onPress, onDelete }: PlantCardProps) => {
    const { colors, radius, shadow } = useTheme();
    const { mergedPlant } = useMergedPlant(plant);
    const { user } = useContext(AuthContext);
    const { household, memberName } = useHousehold();

    const displayName = plant.custom_name || mergedPlant?.name || "Unnamed Plant";
    const imageUri = (plant as IUserPlantMerged).images?.[0] || mergedPlant?.images?.[0] || null;
    const { status, progressPercent, lastWatered } = getWateringProgress(plant, mergedPlant);
    const urgencyColor = getUrgencyColor(status.urgency, colors);

    // "Watered 2 days ago by Sam" when a housemate did it.
    const wateredBy =
        plant.last_watered_by && plant.last_watered_by !== user?.uid
            ? plant.last_watered_by_name ?? memberName(plant.last_watered_by)
            : null;
    const lastWateredText = formatLastWatered(lastWatered, Date.now(), wateredBy);

    // "Shared", or "Sam's" for a housemate's own plant. Nothing when you live alone.
    const hasHousemates = (household?.memberIds.length ?? 0) > 1;
    const ownerName =
        !plant.shared && plant.addedBy && plant.addedBy !== user?.uid ? memberName(plant.addedBy) : null;
    const badge = !hasHousemates ? null : plant.shared ? 'Shared' : ownerName ? `${ownerName}'s` : null;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.card,
                shadow,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.large },
                pressed && styles.pressed,
            ]}
        >
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={[styles.image, { borderRadius: radius.medium }]} />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.primaryMuted, borderRadius: radius.medium }]}>
                    <Ionicons name="leaf" size={26} color={colors.primary} />
                </View>
            )}
            <View style={styles.info}>
                <View style={styles.nameRow}>
                    <ThemedText style={styles.plantName} numberOfLines={1}>{displayName}</ThemedText>
                    {badge ? (
                        <View style={[styles.badge, { backgroundColor: plant.shared ? colors.primaryMuted : colors.surfaceMuted, borderRadius: radius.pill }]}>
                            <ThemedText style={[styles.badgeText, { color: plant.shared ? colors.primary : colors.textMuted }]}>
                                {badge}
                            </ThemedText>
                        </View>
                    ) : null}
                </View>
                {status.message ? (
                    <ThemedText style={[styles.status, { color: urgencyColor }]} numberOfLines={1}>
                        {status.message}
                    </ThemedText>
                ) : null}
                <ThemedText style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                    {lastWateredText}
                </ThemedText>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
                    <View style={[styles.progressFill, { width: progressPercent, backgroundColor: urgencyColor }]} />
                </View>
            </View>
            <Pressable
                accessibilityLabel="Delete"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => onDelete(plant)}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            >
                <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
            </Pressable>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    pressed: {
        opacity: 0.8,
    },
    image: {
        width: 56,
        height: 56,
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        gap: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 1,
    },
    badgeText: {
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '600',
    },
    plantName: {
        flexShrink: 1,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
    },
    status: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    },
    meta: {
        fontSize: 12,
        lineHeight: 16,
    },
    progressTrack: {
        height: 5,
        width: '100%',
        borderRadius: 99,
        overflow: 'hidden',
        marginTop: 6,
    },
    progressFill: {
        height: '100%',
        borderRadius: 99,
    },
    deleteButton: {
        padding: 6,
    },
});

export default PlantCard;
