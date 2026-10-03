import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import { StyleSheet, View } from "react-native";

import { RootStackParamList } from "@/components/navigation/types";
import PlantCard from "@/components/plant/plantCard";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import ParallaxScrollView from "@/components/ui/Views/ParallaxScrollView";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { getWateringProgress } from "@/helpers/plants/wateringProgress";
import { usePlantManagement } from "@/hooks/plants/usePlantManagement";
import useUserPlants from "@/hooks/plants/useUserPlants";
import { useTheme } from "@/hooks/utils/useTheme";
import { RootState } from "@/store/store";
import { Colors } from "@/theme/Colors";

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const userPlants = useSelector((state: RootState) => state.userPlants);
  const { getPlants } = useUserPlants();
  const { handleDeletePlant } = usePlantManagement();

  useEffect(() => {
    getPlants();
  }, [getPlants]);

  // Plants that need attention (overdue, urgent, or soon) sorted soonest-first
  const needsWatering = userPlants
    .map((plant) => ({ plant, progress: getWateringProgress(plant) }))
    .filter(
      ({ progress }) =>
        progress.daysUntil != null && progress.status.urgency !== "ok",
    )
    .sort((a, b) => (a.progress.daysUntil ?? 0) - (b.progress.daysUntil ?? 0));

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: Colors["light"].headerBackground,
        dark: Colors["dark"].headerBackground,
      }}
      headerImage={
        <Ionicons size={200} name="leaf" style={styles.headerImage} />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Plant Friends!</ThemedText>
      </ThemedView>

      <ThemedView style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.statNumber}>{userPlants.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Plants</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.statNumber}>{needsWatering.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Need water</ThemedText>
        </View>
      </ThemedView>

      <ThemedButton
        onPress={() => navigation.navigate("PlantSearch")}
        title="Add a plant"
        additionalStyle={styles.addButton}
      />

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {needsWatering.length > 0 ? "Needs watering" : "All caught up! 🌱"}
      </ThemedText>

      {needsWatering.length > 0 ? (
        needsWatering.map(({ plant }) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onPress={() =>
              navigation.navigate("PlantDetails", { plantId: plant.id })
            }
            onDelete={() => handleDeletePlant(plant)}
          />
        ))
      ) : (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            No plants need watering right now.
          </ThemedText>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "green",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  addButton: {
    marginVertical: 8,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: "center",
  },
});
