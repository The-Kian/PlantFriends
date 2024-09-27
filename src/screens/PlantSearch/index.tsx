import Input from "@components/ui/Input";
import LoadingOverlay from "@components/ui/LoadingOverlay";
import SearchResultComponent from "@components/ui/SearchResult";
import { ThemedText } from "@components/ui/ThemedText";
import { ThemedView } from "@components/ui/ThemedView";
import { useFetchPlants } from "@hooks/useFetchPlants";
import React, { useState } from "react";
import { View, TextInput, Button, FlatList, Text } from "react-native";

interface PlantSearchScreenProps {
    navigation: any;
    }

export default function PlantSearchScreen({ navigation }: PlantSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
    const {plants, loading, error } = useFetchPlants(searchQuery);

  return (
    <ThemedView>
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        isInvalid={false}
        placeholder="Search for a plant"
      />
      {loading && <LoadingOverlay message={`Searching for ${searchQuery}`}/>}
      {error && (
        <>
          <Text>Error fetching plants</Text>
        </>
      )}
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <>
          <SearchResultComponent plant={item} />
          </>
        )}
      />
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </ThemedView>
  );
}
