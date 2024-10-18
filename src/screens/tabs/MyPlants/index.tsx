import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Image, Platform, Modal } from "react-native";

import { Collapsible } from "@components/ui/Views/Collapsible";
import ParallaxScrollView from "@components/ui/Views/ParallaxScrollView";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { ThemedView } from "@components/ui/Views/ThemedView";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { RootStackParamList } from "@components/navigation/types";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useState } from "react";
import { Colors } from "src/theme/Colors";
import PlantSearchView from "@screens/PlantSearch";

export default function PlantScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const navigateToPlantSearch = () => {
    navigation.navigate("PlantSearch");
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: Colors["light"].headerBackground,
        dark: Colors["dark"].headerBackground,
      }}
      headerImage={
        <Ionicons size={200} name="leaf" style={styles.headerImage} />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Manage Your Plants</ThemedText>
      </ThemedView>
      <ThemedButton onPress={navigateToPlantSearch} title="Add plant" />

      <Collapsible title="Living Room"></Collapsible>

      <Collapsible title="Kitchen"></Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "green",
    bottom: 0,
    left: -0,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
