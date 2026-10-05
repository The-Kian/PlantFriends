import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { type ComponentProps, useContext, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { StyleSheet, ScrollView, Image, Alert, View } from "react-native";

import { RootStackParamList } from "@/components/navigation/types";
import { EmptyState } from "@/components/ui/EmptyState";
import SwitchField from "@/components/ui/Input/SwitchField";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import ScreenHeader from "@/components/ui/Views/ScreenHeader";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { WateringPrediction } from "@/components/watering/WateringPrediction";
import { WateringSplash } from "@/components/watering/WateringSplash";
import { AuthContext } from "@/context/auth/AuthProvider";
import { useHousehold } from "@/context/household/HouseholdProvider";
import logWatering from "@/helpers/firebase/logWatering";
import setPlantSharing from "@/helpers/firebase/setPlantSharing";
import { displayNameFor } from "@/helpers/household/setupHousehold";
import { getWateringFrequencyInDays } from "@/helpers/plants/wateringCalculations";
import useMergedPlant from "@/hooks/plants/useMergedPlant";
import { useTheme } from "@/hooks/utils/useTheme";
import ErrorService from "@/services/ErrorService";
import { registerForPush } from "@/services/PushRegistration";
import { RootState } from "@/store/store";
import { updatePlant } from "@/store/userPlantsSlice";
import { Spacing } from "@/theme/Spacing";

type PlantDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "PlantDetails"
>;

type Chip = { icon: ComponentProps<typeof Ionicons>["name"]; label: string };

const PlantDetailsScreen = () => {
  const route = useRoute<PlantDetailsScreenRouteProp>();
  const { plantId } = route.params;
  const { colors, radius, shadow } = useTheme();
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext);
  const { household, memberName, loading: householdLoading } = useHousehold();

  const userPlant = useSelector((state: RootState) =>
    state.userPlants.find((p) => p.id === plantId)
  );

  const { mergedPlant, loading } = useMergedPlant(userPlant || null);

  const [showSplash, setShowSplash] = useState(false);

  // Opened from a notification before the plants have loaded.
  if (!userPlant && householdLoading) {
    return (
      <ThemedView style={styles.screen}>
        <ScreenHeader />
        <LoadingSpinner message="Loading plant details..." fullScreen />
      </ThemedView>
    );
  }

  if (!userPlant) {
    return (
      <ThemedView style={styles.screen}>
        <ScreenHeader />
        <EmptyState icon="help-circle-outline" title="Plant not found" />
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <ScreenHeader />
        <LoadingSpinner message="Loading plant details..." fullScreen />
      </ThemedView>
    );
  }

  const displayName =
    userPlant.custom_name || mergedPlant?.name || "Unnamed Plant";
  const imageUri = mergedPlant?.images?.[0] || null;
  const scientificName = mergedPlant?.scientific_name?.length
    ? mergedPlant.scientific_name.join(", ")
    : null;

  const handleLogWatering = async () => {
    try {
      if (!user || !household) {
        Alert.alert("Error", "You must be logged in to log watering");
        return;
      }

      const frequency = getWateringFrequencyInDays(
        userPlant.custom_watering_schedule ?? null,
        mergedPlant?.watering_frequency
      );

      // Only the watering fields are written. The server tells the plant's
      // other carers, and works out the next reminder.
      const updatedPlant = await logWatering(
        household.id,
        userPlant,
        { uid: user.uid, displayName: displayNameFor(user) },
        frequency,
      );

      dispatch(updatePlant(updatedPlant));
      setShowSplash(true);

      await registerForPush(user.uid, { prompt: true });
    } catch (error) {
      ErrorService.handleError(error, "Log Watering", {
        userMessage: "Failed to log watering. Please try again.",
      });
    }
  };

  const handleSharedChange = async (shared: boolean) => {
    if (!user || !household) return;
    try {
      dispatch(updatePlant(await setPlantSharing(household, userPlant, shared, user.uid)));
    } catch (error) {
      ErrorService.handleError(error, "Share Plant", {
        userMessage: "Couldn't change sharing. Please try again.",
      });
    }
  };

  // "by Sam" when a housemate did the last watering.
  const lastWateredBy =
    userPlant.last_watered_by && userPlant.last_watered_by !== user?.uid
      ? userPlant.last_watered_by_name ?? memberName(userPlant.last_watered_by)
      : null;
  const ownerName =
    !userPlant.shared && userPlant.addedBy && userPlant.addedBy !== user?.uid
      ? memberName(userPlant.addedBy)
      : null;
  const hasHousemates = (household?.memberIds.length ?? 0) > 1;

  // Quick-glance facts shown as chips under the title.
  const chips: Chip[] = [];
  if (userPlant.shared && hasHousemates) {
    chips.push({ icon: "people-outline", label: "Shared" });
  } else if (ownerName) {
    chips.push({ icon: "person-outline", label: `${ownerName}'s plant` });
  }
  if (userPlant.houseLocation) {
    chips.push({ icon: "home-outline", label: userPlant.houseLocation });
  }
  if (mergedPlant?.sun_requirements) {
    chips.push({ icon: "sunny-outline", label: mergedPlant.sun_requirements });
  }
  if (typeof userPlant.custom_watering_schedule === "number") {
    chips.push({
      icon: "calendar-outline",
      label: `Your schedule: every ${userPlant.custom_watering_schedule} days`,
    });
  }

  const cardStyle = [
    styles.card,
    shadow,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.large,
    },
  ];

  return (
    <ThemedView style={styles.screen}>
      <ScreenHeader floating />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.hero} />
        ) : (
          <View
            style={[
              styles.hero,
              styles.heroPlaceholder,
              { backgroundColor: colors.primaryMuted },
            ]}
          >
            <Ionicons name="leaf" size={96} color={colors.primary} />
          </View>
        )}

        <View style={[styles.body, { backgroundColor: colors.background }]}>
          <View>
            <ThemedText type="title">{displayName}</ThemedText>
            {scientificName && (
              <ThemedText type="caption" style={styles.scientific}>
                {scientificName}
              </ThemedText>
            )}
          </View>

          {chips.length > 0 && (
            <View style={styles.chips}>
              {chips.map((chip) => (
                <View
                  key={chip.label}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Ionicons
                    name={chip.icon}
                    size={14}
                    color={colors.textMuted}
                  />
                  <ThemedText style={[styles.chipText, { color: colors.text }]}>
                    {chip.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          <WateringPrediction
            lastWatered={userPlant.last_watered_date ?? null}
            lastWateredBy={lastWateredBy}
            wateringFrequency={mergedPlant?.watering_frequency}
            customSchedule={userPlant.custom_watering_schedule ?? null}
            onLogWatering={handleLogWatering}
          />

          {hasHousemates && (
            <View style={cardStyle}>
              <SwitchField
                label="Shared with the household"
                description="Everyone gets its reminders, and hears when someone waters it."
                value={userPlant.shared ?? false}
                onValueChange={handleSharedChange}
              />
            </View>
          )}

          {mergedPlant?.description && (
            <View style={cardStyle}>
              <ThemedText type="label">About</ThemedText>
              <ThemedText>{mergedPlant.description}</ThemedText>
            </View>
          )}

          {userPlant.custom_notes && (
            <View style={cardStyle}>
              <ThemedText type="label">Your Notes</ThemedText>
              <ThemedText>{userPlant.custom_notes}</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
      <WateringSplash
        visible={showSplash}
        onComplete={() => setShowSplash(false)}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  hero: {
    width: "100%",
    height: 280,
  },
  heroPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    marginTop: -Spacing.large,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.medium + 4,
    paddingTop: Spacing.large,
    gap: Spacing.medium,
  },
  scientific: {
    fontStyle: "italic",
    marginTop: 2,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.small,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  card: {
    padding: Spacing.medium,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default PlantDetailsScreen;
