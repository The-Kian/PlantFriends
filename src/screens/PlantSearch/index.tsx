import PlantCustomizationModal from "@components/plant/PlantCustomisationModal";
import Input from "@components/ui/Input";
import LoadingOverlay from "@components/ui/LoadingOverlay";
import SearchResultComponent from "@components/ui/SearchResult";
import { ThemedText } from "@components/ui/ThemedText";
import { ThemedView } from "@components/ui/ThemedView";
import { IPlant } from "@constants/IPlant";
import { useFetchPlants } from "@hooks/useFetchPlants";
import React, { useState } from "react";
import { View, TextInput, Button, FlatList, Text } from "react-native";

interface PlantSearchScreenProps {
  navigation: any;
}

export default function PlantSearchScreen({
  navigation,
}: PlantSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { plants, loading, error } = useFetchPlants(searchQuery);
  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);

  return (
    <ThemedView>
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        isInvalid={false}
        placeholder="Search for a plant"
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
        <PlantCustomizationModal plant={selectedPlant} onClose={() => setSelectedPlant(null)} onSave={(customizedPlant) => {
          console.log(`🚀 ~ <PlantCustomizationModalplant={selectedPlant}onClose={ ~ customizedPlant:`, customizedPlant)
          
        }}/>
        // <ThemedText>{selectedPlant.attributes.name}</ThemedText>
      )}
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </ThemedView>
  );
}
