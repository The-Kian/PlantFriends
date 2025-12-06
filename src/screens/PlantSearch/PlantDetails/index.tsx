import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";

import { StyleSheet, ScrollView, Image } from "react-native";

import { RootStackParamList } from "@/components/navigation/types";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { IPlant } from "@/constants/IPlant";
import useMergedPlant from "@/hooks/plants/useMergedPlant";
import { useTheme } from "@/hooks/utils/useTheme";
import { RootState } from "@/store/store";

type PlantDetailsScreenRouteProp = RouteProp<RootStackParamList, "PlantDetails">;

const PlantDetailsScreen = () => {
    const route = useRoute<PlantDetailsScreenRouteProp>();
    const { plantId } = route.params;
    const { colors } = useTheme();

    // Get the user plant from Redux store
    const userPlant = useSelector((state: RootState) => 
        state.userPlants.find((p) => p.id === plantId)
    );

    // Get merged plant data (includes base plant info)
    const { mergedPlant, loading } = useMergedPlant(userPlant || null);

    if (!userPlant) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText type="title">Plant not found</ThemedText>
            </ThemedView>
        );
    }

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Loading plant details...</ThemedText>
            </ThemedView>
        );
    }

    const displayName = userPlant.custom_name || mergedPlant?.name || "Unnamed Plant";
    const imageUri = (userPlant as IPlant).images?.[0] || mergedPlant?.images?.[0] || null;

    return (
        <ScrollView style={{ flex: 1 }}>
            <ThemedView style={styles.container}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.image} />
                ) : (
                    <ThemedView style={[styles.imagePlaceholder, { backgroundColor: colors.card }]}>
                        <Ionicons name="leaf-outline" size={120} color={colors.icon} />
                    </ThemedView>
                )}

                <ThemedText type="title" style={styles.title}>{displayName}</ThemedText>
                
                {mergedPlant?.scientific_name && mergedPlant.scientific_name.length > 0 && (
                    <ThemedView style={styles.section}>
                        <ThemedText type="subtitle">Scientific Name</ThemedText>
                        <ThemedText>{mergedPlant.scientific_name.join(", ")}</ThemedText>
                    </ThemedView>
                )}

                {mergedPlant?.description && (
                    <ThemedView style={styles.section}>
                        <ThemedText type="subtitle">Description</ThemedText>
                        <ThemedText>{mergedPlant.description}</ThemedText>
                    </ThemedView>
                )}

                {mergedPlant?.sun_requirements && (
                    <ThemedView style={styles.section}>
                        <ThemedText type="subtitle">Sunlight</ThemedText>
                        <ThemedText>{mergedPlant.sun_requirements}</ThemedText>
                    </ThemedView>
                )}

                {mergedPlant?.watering_frequency && (
                    <ThemedView style={styles.section}>
                        <ThemedText type="subtitle">Watering Frequency</ThemedText>
                        <ThemedText>Every {mergedPlant.watering_frequency} days</ThemedText>
                    </ThemedView>
                )}

                {userPlant.custom_notes && (
                    <ThemedView style={styles.section}>
                        <ThemedText type="subtitle">Your Notes</ThemedText>
                        <ThemedText>{userPlant.custom_notes}</ThemedText>
                    </ThemedView>
                )}

                {userPlant.houseLocation && (
                    <ThemedView style={styles.section}>
                        <ThemedText type="subtitle">Location</ThemedText>
                        <ThemedText>{userPlant.houseLocation}</ThemedText>
                    </ThemedView>
                )}
            </ThemedView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    image: {
        width: "100%",
        height: 300,
        borderRadius: 15,
        marginBottom: 20,
    },
    imagePlaceholder: {
        width: "100%",
        height: 300,
        borderRadius: 15,
        marginBottom: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
});

export default PlantDetailsScreen;