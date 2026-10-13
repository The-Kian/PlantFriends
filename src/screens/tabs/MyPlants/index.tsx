import { useNavigation, NavigationProp } from "@react-navigation/native";
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
import { useHousehold } from "@/context/household/HouseholdProvider";
import { usePlantManagement } from "@/hooks/plants/usePlantManagement";
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
  // Plants stay up to date through the household's live listener.
  const { loading, error } = useHousehold();
  const { handleDeletePlant } = usePlantManagement();

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
