import React, { useContext, useState } from "react";
import { FlatList, Text } from "react-native";

import PlantCustomizationModal from "@components/plant/customization/CustomizatonModal";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import SearchResultComponent from "@components/ui/Buttons/SearchResult";
import LoadingOverlay from "@components/ui/Views/LoadingOverlay";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import getUserPlantData from "@helpers/getUserPlantData";
import savePlantToFirebase from "@helpers/savePlantToFirebase";
import { useFetchPlants } from "@hooks/useFetchPlants";
import styles from "./index.styles";
import TextInputField from "@components/ui/Input/TextInputField";

interface PlantSearchScreenProps {
  navigation: any;
}

export default function PlantSearchScreen({
  navigation,
}: PlantSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { plants, loading, error } = useFetchPlants(searchQuery);
  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);
  const [userPlant, setUserPlant] = useState<IUserPlant | undefined>(undefined);
  const { user } = useContext(AuthContext);

  const handleSelectPlant = async (plant: IPlant) => {
    setSelectedPlant(plant);
    if (user) {
      const userPlantData = await getUserPlantData(user.uid, plant.id);
      setUserPlant(userPlantData);
    }
  };

  const handleSave = async (
    updatedUserPlant: IUserPlant,
    plantData: IPlant
  ) => {
    await savePlantToFirebase(updatedUserPlant, plantData, user);
    setSelectedPlant(null);
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
      <ThemedView style={styles.container}>
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultComponent
              onSelect={() => handleSelectPlant(item)}
              plant={item}
            />
          )}
        />
      </ThemedView>
      {selectedPlant && (
        <PlantCustomizationModal
          plant={selectedPlant}
          userPlant={userPlant}
          onClose={() => {
            setSelectedPlant(null);
          }}
          onSave={handleSave}
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
