import { NavigationProp } from "@react-navigation/native";
import React, { useState, useContext, useEffect } from "react";

import { Text } from "react-native";
import uuid from "react-native-uuid";

import { RootStackParamList } from "@/components/navigation/types";
import PlantCustomizationModal from "@/components/plant/CustomizationModal";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import TextInputField from "@/components/ui/Input/TextInputField";
import LoadingOverlay from "@/components/ui/Views/LoadingOverlay";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { IUserPlant, IPlant } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import savePlantToFirebase from "@/helpers/savePlantToFirebase";
import { useCombinedPlantSearch } from "@/hooks/search/useCombinedPlantSearch";

import styles from "./index.styles";
import PlantSearchResults from "./Results";

interface PlantSearchScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export const PlantSearchScreen = ({ navigation }: PlantSearchScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { plants, loading, error } = useCombinedPlantSearch(searchQuery);
  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);
  const { user } = useContext(AuthContext);
  const [userPlant, setUserPlant] = useState<IUserPlant | null>(null);
  const [isAddingNewPlant, setIsAddingNewPlant] = useState(false);

  useEffect(() => {
    if (selectedPlant && user) {
      setUserPlant({
        userId: user.uid || "",
        plantId: selectedPlant.id || "",
        id: uuid.v4().toString(),
        custom_attributes: {},
      });
    } else {
      setUserPlant(null);
    }
  }, [selectedPlant, user]);

  const handleSelectPlant = (plant: IPlant) => {
    setSelectedPlant(plant);
    setIsAddingNewPlant(false);
  };

  const handleAddNewPlant = () => {
    setSelectedPlant(null);
    setUserPlant(null);
    setIsAddingNewPlant(true);
  };

  const closeModal = () => {
    setSelectedPlant(null);
    setUserPlant(null);
    setIsAddingNewPlant(false);
  };

  const handleSave = async (userData: IUserPlant, plantData: IPlant) => {
    if (isAddingNewPlant) {
      userData.plantId = plantData.id;
    }
    await savePlantToFirebase(userData, plantData, user);

    closeModal();
    navigation.navigate("Tab");
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

      <ThemedButton
        title="Add a new plant (not in search results)"
        onPress={handleAddNewPlant}
        additionalStyle={styles.addPlantButton}
      />

      {(selectedPlant || isAddingNewPlant) && (
        <PlantCustomizationModal
          plant={selectedPlant || undefined}
          userPlant={userPlant || undefined}
          onClose={closeModal}
          onSave={handleSave}
          displayUserPlantData={true}
          isAddingNewPlant={isAddingNewPlant}
        />
      )}

      <ThemedButton
        title="Go Back"
        onPress={() => navigation.goBack()}
        additionalStyle={styles.goBackButton}
      />
    </ThemedView>
  );
};

export default PlantSearchScreen;
