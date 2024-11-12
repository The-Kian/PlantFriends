import { IPlant } from "@constants/IPlant";

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
      }}
      additionalStyle={[searchResultStyle.container]}
      title={plant.name}
    />
  );
};

export default SearchResultComponent;
