import { IPlant } from "@constants/IPlant";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Pressable, StyleSheet } from "react-native";
import ThemedButton from "./ThemedButton";
import { useState } from "react";

const SearchResultComponent = ({ plant }: { plant: IPlant }) => {
    const [pressed, setPressed] = useState(false);
  return (
    <ThemedButton
      onPress={() => {
        console.log(`🚀 ~ SearchResultComponent ~ plant:`, plant);
      }}
      additionalStyle={[searchResultStyle.container]}
    >
        <ThemedText>{plant.attributes.name}</ThemedText>
    </ThemedButton>
  );
};

export default SearchResultComponent;

const searchResultStyle = StyleSheet.create({
  container: {
    padding: 10,
    margin: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    height: 50,
    borderWidth: 1,
  },
});
