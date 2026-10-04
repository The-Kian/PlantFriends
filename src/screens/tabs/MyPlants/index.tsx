import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { StyleSheet, View } from "react-native";

import ProfileButton from "@/components/navigation/ProfileButton";
import { RootStackParamList } from "@/components/navigation/types";
import PlantCard from "@/components/plant/plantCard";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { Collapsible } from "@/components/ui/Views/Collapsible";
import LoadingOverlay from "@/components/ui/Views/LoadingOverlay";
import ScreenScrollView from "@/components/ui/Views/ScreenScrollView";
import { IUserPlant } from "@/constants/IPlant";
import { usePlantManagement } from "@/hooks/plants/usePlantManagement";
import useUserPlants from "@/hooks/plants/useUserPlants";
import { useTheme } from "@/hooks/utils/useTheme";
import { RootState } from "@/store/store";
import { Spacing } from "@/theme/Spacing";

const OTHER_LOCATION = "Other Rooms";

// Group plants by the room they're in, keeping rooms in first-seen order
// and putting unassigned plants last.
function groupByLocation(plants: IUserPlant[]): [string, IUserPlant[]][] {
  const groups = new Map<string, IUserPlant[]>();
  for (const plant of plants) {
    const location = plant.houseLocation?.trim() || OTHER_LOCATION;
    groups.set(location, [...(groups.get(location) ?? []), plant]);
  }
  const other = groups.get(OTHER_LOCATION);
  groups.delete(OTHER_LOCATION);
  const entries = [...groups.entries()];
  if (other) entries.push([OTHER_LOCATION, other]);
  return entries;
}

export default function MyPlantsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors, radius } = useTheme();

  const userPlants = useSelector((state: RootState) => state.userPlants);
  const { getPlants } = useUserPlants();
  const { handleDeletePlant } = usePlantManagement();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await getPlants();
      } catch {
        if (active) {
          setError("Failed to load your plants. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [getPlants]);

  const navigateToPlantSearch = () => {
    navigation.navigate("PlantSearch");
  };

  if (loading) {
    return <LoadingOverlay message="Loading your plants..." />;
  }

  const groups = groupByLocation(userPlants);

  return (
    <ScreenScrollView title="Manage Your Plants" right={<ProfileButton />}>
      <ThemedButton
        onPress={navigateToPlantSearch}
        title="Add plant"
        icon="add"
        variant="secondary"
      />

      {error && (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.errorMuted, borderRadius: radius.medium },
          ]}
        >
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {error}
          </ThemedText>
        </View>
      )}

      {!error && userPlants.length === 0 && (
        <EmptyState
          title="No plants yet"
          message={'Tap "Add plant" to grow your collection!'}
        />
      )}

      {groups.map(([location, plants]) => (
        <Collapsible
          key={location}
          title={location}
          count={plants.length}
          defaultOpen
        >
          {plants.map((item) => (
            <PlantCard
              key={item.id}
              plant={item}
              onPress={() =>
                navigation.navigate("PlantDetails", { plantId: item.id })
              }
              onDelete={() => handleDeletePlant(item)}
            />
          ))}
        </Collapsible>
      ))}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    padding: Spacing.medium,
  },
  errorText: {
    textAlign: "center",
    fontWeight: "600",
  },
});
