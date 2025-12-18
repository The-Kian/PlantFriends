import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useContext } from "react";
import { useSelector, useDispatch } from "react-redux";

import { StyleSheet, ScrollView, Image, Alert } from "react-native";

import { RootStackParamList } from "@/components/navigation/types";
import { WateringPrediction } from "@/components/plant/WateringPrediction";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthContext } from "@/context/auth/AuthProvider";
import saveUserPlantToFirebase from "@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase";
import {
    calculateNextWateringDate,
    getWateringFrequencyInDays,
} from "@/helpers/plants/wateringCalculations";
import useMergedPlant from "@/hooks/plants/useMergedPlant";
import { useTheme } from "@/hooks/utils/useTheme";
import { RootState } from "@/store/store";
import { updatePlant } from "@/store/userPlantsSlice";

type PlantDetailsScreenRouteProp = RouteProp<RootStackParamList, "PlantDetails">;

const PlantDetailsScreen = () => {
    const route = useRoute<PlantDetailsScreenRouteProp>();
    const { plantId } = route.params;
    const { colors } = useTheme();
    const dispatch = useDispatch();
    const { user } = useContext(AuthContext);

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
    const imageUri = mergedPlant?.images?.[0] || null;

    const handleLogWatering = async () => {
        try {
            if (!user) {
                Alert.alert("Error", "You must be logged in to log watering");
                return;
            }

            const now = Date.now();
            const frequency = getWateringFrequencyInDays(
                userPlant.custom_watering_schedule ?? null,
                mergedPlant?.watering_frequency
            );

            const nextDate = calculateNextWateringDate(now, frequency);

            const updatedPlant = {
                ...userPlant,
                last_watered_date: now,
                next_watering_date: nextDate,
            };

            // Persist to Firebase first to ensure data consistency
            await saveUserPlantToFirebase(updatedPlant, user);

            // Update Redux after successful save
            dispatch(updatePlant(updatedPlant));
            Alert.alert("Success", "Watering logged successfully!");
        } catch (error) {
            console.error("Error logging watering:", error);
            Alert.alert("Error", "Failed to log watering. Please try again.");
        }
    };

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
                        <ThemedText type="subtitle">Base Watering Frequency</ThemedText>
                        <ThemedText>Every {mergedPlant.watering_frequency} days</ThemedText>
                    </ThemedView>
                )}

                {typeof userPlant.custom_watering_schedule === 'number' && (
                    <ThemedView style={styles.section}>
                        <ThemedText type="subtitle">Your Watering Schedule</ThemedText>
                        <ThemedText>
                            {userPlant.custom_watering_schedule === null
                              ? 'As needed'
                              : `Every ${userPlant.custom_watering_schedule} days`}
                        </ThemedText>
                    </ThemedView>
                )}

                <WateringPrediction
                    lastWatered={userPlant.last_watered_date ?? null}
                    wateringFrequency={mergedPlant?.watering_frequency}
                    customSchedule={userPlant.custom_watering_schedule ?? null}
                    onLogWatering={handleLogWatering}
                />

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