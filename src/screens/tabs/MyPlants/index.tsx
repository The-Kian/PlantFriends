import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import { StyleSheet } from "react-native";

import { RootStackParamList } from "@components/navigation/types";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { Collapsible } from "@components/ui/Views/Collapsible";
import ParallaxScrollView from "@components/ui/Views/ParallaxScrollView";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { usePlantManagement } from "@hooks/user/usePlantManagement";
import useUserPlants from "@hooks/user/useUserPlants";
import { RootState } from "@store/store";
import { Colors } from "@theme/Colors";




export default function MyPlantsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const userPlants = useSelector((state: RootState) => state.userPlants);
  const { getPlants } = useUserPlants();
  const { handleDeletePlant } = usePlantManagement();

  useEffect(() => {
    getPlants();
  }, [getPlants]);

  const navigateToPlantSearch = () => {
    navigation.navigate("PlantSearch");
  };

  const renderPlantsByLocation = (location: string) => {
    const plantsInLocation = userPlants.filter(
      (plant) => {
        if (location === "Other") {
          return !plant.houseLocation || plant.houseLocation === "";
        }
        return plant.houseLocation === location;
      }
    );

    return (
      <ThemedView>
        {plantsInLocation.map((item) => (
          <ThemedView key={item.id}>
            <ThemedText>{item.custom_name || "Unnamed Plant"}</ThemedText>
            <ThemedButton
              title="Delete"
              onPress={() => handleDeletePlant(item)}
            />
          </ThemedView>
        ))}
      </ThemedView>
    );
  };

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
        <ThemedText type="title">Manage Your Plants</ThemedText>
      </ThemedView>
      <ThemedButton onPress={navigateToPlantSearch} title="Add plant" />

      <Collapsible title="Living Room">
        {renderPlantsByLocation("Living Room")}
      </Collapsible>

      <Collapsible title="Kitchen">
        {renderPlantsByLocation("Kitchen")}
      </Collapsible>

      <Collapsible title="Other Rooms">
      {renderPlantsByLocation("Other")}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "green",
    bottom: 0,
    left: -0,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
