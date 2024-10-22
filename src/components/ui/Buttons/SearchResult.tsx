import { IPlant } from "@constants/IPlant";
import { ThemedText } from "../Text/ThemedText";
import { searchResultStyle } from "./SearchResult.styles";
import ThemedButton from "./ThemedButton";

interface SearchResultComponentProps {
  plant: IPlant;
  onSelect: () => void;
}

const SearchResultComponent = ({
  plant,
  onSelect,
}: SearchResultComponentProps) => {
  return (
    <ThemedButton
      onPress={() => {
        onSelect();
        console.log(`🚀 ~ plant:`, plant)
      }}
      additionalStyle={[searchResultStyle.container]}
      title={plant.attributes.name}
    />
  );
};

export default SearchResultComponent;
