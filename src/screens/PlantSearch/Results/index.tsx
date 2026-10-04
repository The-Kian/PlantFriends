import { FlatList } from "react-native";

import SearchResultComponent from "@/components/ui/Buttons/SearchResult";
import { IPlant } from "@/constants/IPlant";

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
    <FlatList
      style={styles.results}
      contentContainerStyle={styles.resultsContent}
      keyboardShouldPersistTaps="handled"
      data={plants}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SearchResultComponent
          onSelect={() => onSelectPlant(item)}
          plant={item}
        />
      )}
    />
  );
}

export default PlantSearchResults;
