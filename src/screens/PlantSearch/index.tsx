

import { NavigationProp } from "@react-navigation/native";
import { useState } from "react";

import {Text } from "react-native";
import { useDispatch } from "react-redux";

import { IUserPlant, IPlant } from "@constants/IPlant";
import { RootStackParamList } from "@components/navigation/types";
import PlantCustomizationModal from "@components/plant/CustomizatonModal";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import TextInputField from "@components/ui/Input/TextInputField";
import LoadingOverlay from "@components/ui/Views/LoadingOverlay";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { useFetchAPIPlants } from "@hooks/useFetchPlants";
import usePlantSelection from "@hooks/usePlantSelection";
import { addPlant } from "@store/userPlantsSlice";


import styles from "./index.styles";
import PlantSearchResults from "./Results";

interface PlantSearchScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export default function PlantSearchScreen({
  navigation,
}: PlantSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { plants, loading, error } = useFetchAPIPlants(searchQuery);
  const { selectedPlant, userPlant, handleSelectPlant, handleSaveToFirebase, closeModal } = usePlantSelection();
  const dispatch = useDispatch();

  const handleSavePlant = async (userPlant: IUserPlant, plant: IPlant) => {
    await handleSaveToFirebase(userPlant, plant);
    dispatch(addPlant(userPlant));
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <TextInputField
        value={searchQuery}
        onChangeText={setSearchQuery}
        label={"Search for a plant"}
      />
      {loading && <LoadingOverlay message={`Searching for ${searchQuery}`} />}
      {error && <Text>Error fetching plants</Text>}
      <PlantSearchResults plants={plants} onSelectPlant={handleSelectPlant} />
      {selectedPlant && (
        <PlantCustomizationModal
          plant={selectedPlant}
          userPlant={userPlant}
          onClose={closeModal}
          onSave={handleSavePlant}
        />
      )}
      <ThemedButton
        title="Submit new plant to database"
        onPress={() => navigation.navigate("SubmitPlant")}
        additionalStyle={styles.addPlantButton}
      />
      <ThemedButton
        title="Go Back"
        onPress={() => navigation.goBack()}
        additionalStyle={styles.goBackButton}
      />
    </ThemedView>
  );
}
