import PlantCustomizationModal from "@components/plant/PlantCustomizationModal";
import Input from "@components/ui/Input/TextInputField";
import LoadingOverlay from "@components/ui/Views/LoadingOverlay";
import SearchResultComponent from "@components/ui/Buttons/SearchResult";

import { ThemedView } from "@components/ui/Views/ThemedView";
import { IPlant } from "@constants/IPlant";
import { useFetchPlants } from "@hooks/useFetchPlants";
import React, { useContext, useState } from "react";
import { Button, FlatList, Text } from "react-native";
import savePlantToFirebase from "src/helpers/savePlantToFirebase";
import { AuthContext } from "@context/auth/AuthProvider";

interface PlantSearchScreenProps {
  navigation: any;
}

export default function PlantSearchScreen({
  navigation,
}: PlantSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { plants, loading, error } = useFetchPlants(searchQuery);
  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);

  const { user } = useContext(AuthContext);

  return (
    <ThemedView>
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        label={"Search for a plant"}
      />
      {loading && <LoadingOverlay message={`Searching for ${searchQuery}`} />}
      {error && <Text>Error fetching plants</Text>}
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SearchResultComponent
            onSelect={() => setSelectedPlant(item)}
            plant={item}
          />
        )}
      />
      {selectedPlant && (
        <PlantCustomizationModal
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
          onSave={(customizedPlant) =>
            savePlantToFirebase(customizedPlant, user)
          }
        />
      )}
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </ThemedView>
  );
}
