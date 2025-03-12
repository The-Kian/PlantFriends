
import SearchResultComponent from "@components/ui/Buttons/SearchResult";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { IPlant } from "@constants/IPlant";

import { FlatList } from "react-native";

import styles from "../index.styles";

// PlantSearchResults.tsx
interface PlantSearchResultsProps {
  plants: IPlant[];
  onSelectPlant: (plant: IPlant) => void;
}

function PlantSearchResults({
  plants,
  onSelectPlant,
}: PlantSearchResultsProps) {
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SearchResultComponent
            onSelect={() => onSelectPlant(item)}
            plant={item}
          />
        )}
      />
    </ThemedView>
  );
}

export default PlantSearchResults;
