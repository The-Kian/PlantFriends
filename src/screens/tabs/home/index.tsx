import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";

import { StyleSheet, View } from "react-native";

import ProfileButton from "@/components/navigation/ProfileButton";
import { RootStackParamList } from "@/components/navigation/types";
import PlantCard from "@/components/plant/plantCard";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import ScreenScrollView from "@/components/ui/Views/ScreenScrollView";
import { useHousehold } from "@/context/household/HouseholdProvider";
import { getWateringProgress } from "@/helpers/plants/wateringProgress";
import { usePlantManagement } from "@/hooks/plants/usePlantManagement";
import { useTheme } from "@/hooks/utils/useTheme";
import { RootState } from "@/store/store";
import { Spacing } from "@/theme/Spacing";

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors, radius } = useTheme();

  const userPlants = useSelector((state: RootState) => state.userPlants);
  // Plants stay up to date through the household's live listener.
  const { household } = useHousehold();
  const { handleDeletePlant } = usePlantManagement();

  // Plants due today or tomorrow, overdue ones, and ones never watered (they
  // have no schedule yet, so they need a first watering), soonest first.
  // "Soon" (2-3 days away) is not counted: a plant watered a minute ago on
  // a 3-day schedule doesn't need water.
  const needsWatering = userPlants
    .map((plant) => ({ plant, progress: getWateringProgress(plant) }))
    .filter(
      ({ progress }) =>
        progress.daysUntil == null ||
        progress.status.urgency === "overdue" ||
        progress.status.urgency === "urgent",
    )
    .sort(
      (a, b) =>
        (a.progress.daysUntil ?? -Infinity) - (b.progress.daysUntil ?? -Infinity),
    );
  const hasPlants = userPlants.length > 0;

  return (
    <ScreenScrollView
      title="Plant Friends!"
      eyebrow={household?.name ?? "Today"}
      right={<ProfileButton />}
    >
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.large,
            },
          ]}
        >
          <Ionicons name="leaf-outline" size={18} color={colors.primary} />
          <ThemedText style={styles.statNumber}>{userPlants.length}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>
            Plants
          </ThemedText>
        </View>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.waterMuted,
              borderColor: colors.waterMuted,
              borderRadius: radius.large,
            },
          ]}
        >
          <Ionicons name="water-outline" size={18} color={colors.water} />
          <ThemedText style={styles.statNumber}>
            {needsWatering.length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>
            Need water
          </ThemedText>
        </View>
      </View>

      <View>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {needsWatering.length > 0
            ? "Needs watering"
            : hasPlants
              ? "All caught up"
              : "No plants yet"}
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
          <View
            style={[
              styles.emptyContainer,
              { backgroundColor: colors.primaryMuted, borderRadius: radius.large },
            ]}
          >
            <Ionicons
              name={hasPlants ? "checkmark-circle" : "leaf-outline"}
              size={28}
              color={colors.primary}
            />
            <ThemedText style={[styles.emptyText, { color: colors.primary }]}>
              {hasPlants
                ? "No plants need watering right now."
                : "Add your first plant and we'll remind you when it needs water."}
            </ThemedText>
          </View>
        )}
      </View>

      <ThemedButton
        onPress={() => navigation.navigate("PlantSearch")}
        title="Add a plant"
        icon="add"
        variant="secondary"
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: Spacing.small + 4,
  },
  statCard: {
    flex: 1,
    padding: Spacing.medium,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statNumber: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 14,
  },
  sectionTitle: {
    marginBottom: Spacing.small + 4,
  },
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.small + 4,
    padding: Spacing.medium,
  },
  emptyText: {
    flex: 1,
    fontWeight: "600",
  },
});
