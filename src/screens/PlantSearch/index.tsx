import { NavigationProp, StackActions } from "@react-navigation/native";
import React, { useState, useContext, useEffect } from "react";

import { Alert, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

import { RootStackParamList } from "@/components/navigation/types";
import PlantCustomizationModal from "@/components/plant/CustomizationModal";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import TextInputField from "@/components/ui/Input/TextInputField";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import ScreenHeader from "@/components/ui/Views/ScreenHeader";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { IUserPlant, IPlant } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import { useHousehold } from "@/context/household/HouseholdProvider";
import { searchErrorMessage } from "@/helpers/errors/friendlyErrors";
import savePlantToFirebase from "@/helpers/firebase/savePlantToFirebase";
import { registerWithExplanation } from "@/helpers/notifications/registerWithExplanation";
import {
  MIN_SEARCH_LENGTH,
  useCombinedPlantSearch,
} from "@/hooks/search/useCombinedPlantSearch";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

import styles from "./index.styles";
import PlantSearchResults from "./Results";

interface PlantSearchScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export const PlantSearchScreen = ({ navigation }: PlantSearchScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { plants, loading, error, searched } =
    useCombinedPlantSearch(searchQuery);
  const trimmedQuery = searchQuery.trim();
  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);
  const { user } = useContext(AuthContext);
  const { household } = useHousehold();
  const [userPlant, setUserPlant] = useState<IUserPlant | null>(null);
  const [isAddingNewPlant, setIsAddingNewPlant] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (selectedPlant && user) {
      setUserPlant({
        userId: user.uid || "",
        plantId: selectedPlant.id || "",
        id: uuid.v4().toString(),
        custom_attributes: {},
      });
    } else {
      setUserPlant(null);
    }
  }, [selectedPlant, user]);

  const handleSelectPlant = (plant: IPlant) => {
    setSelectedPlant(plant);
    setIsAddingNewPlant(false);
  };

  const handleAddNewPlant = () => {
    setSelectedPlant(null);
    setUserPlant(null);
    setIsAddingNewPlant(true);
  };

  const closeModal = () => {
    setSelectedPlant(null);
    setUserPlant(null);
    setIsAddingNewPlant(false);
  };

  const handleSave = async (userData: IUserPlant, plantData: IPlant) => {
    const hasName =
      !!plantData.name?.trim() || (plantData.scientific_name?.length ?? 0) > 0;
    if (!hasName) {
      Alert.alert("Name needed", "Give the plant a name before saving it.");
      return;
    }
    if (isAddingNewPlant) {
      userData.plantId = plantData.id;
    }
    // The household's live listener adds the plant to the list.
    const saved = await savePlantToFirebase(
      userData,
      plantData,
      user,
      household
    );

    // On failure the error has been shown; keep the form open so nothing
    // typed is lost and the user can try again.
    if (!saved) {
      return;
    }

    closeModal();
    // Replace this screen, so Back from the plant goes to where the user was.
    navigation.dispatch(
      StackActions.replace("PlantDetails", { plantId: userData.id })
    );

    // A good moment to ask for notifications: reminders for this plant, and
    // (from phase 4) hearing when a housemate waters it.
    if (user) {
      await registerWithExplanation(user.uid);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Add a plant" />
      <View style={styles.body}>
        <TextInputField
          value={searchQuery}
          onChangeText={setSearchQuery}
          label={"Search for a plant"}
          placeholder="Monstera, pothos, fern..."
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading && (
          <LoadingSpinner
            size="small"
            message={`Searching for ${searchQuery}`}
          />
        )}
        {error && (
          <ThemedText
            style={[styles.status, { color: colors.error }]}
            accessibilityRole="alert"
          >
            {searchErrorMessage(error, plants.length > 0)}
          </ThemedText>
        )}
        {plants.length > 0 ? (
          <PlantSearchResults
            plants={plants}
            onSelectPlant={handleSelectPlant}
          />
        ) : trimmedQuery.length < MIN_SEARCH_LENGTH ? (
          <EmptyState
            icon="search-outline"
            title="Find your plant"
            message={
              trimmedQuery.length === 0
                ? "Search by common or Latin name, like monstera or Ficus lyrata."
                : "Keep typing: searches need at least 2 letters."
            }
          />
        ) : searched && !loading && !error ? (
          <EmptyState
            icon="leaf-outline"
            title={`No plants match "${trimmedQuery}"`}
            message="Check the spelling, or add it yourself."
            actionLabel="Add it yourself"
            onAction={handleAddNewPlant}
          />
        ) : null}
      </View>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.small,
            borderTopColor: colors.border,
          },
        ]}
      >
        <ThemedButton
          title="Add a new plant (not in search results)"
          onPress={handleAddNewPlant}
          icon="create-outline"
          variant="secondary"
        />
      </View>

      {(selectedPlant || isAddingNewPlant) && (
        <PlantCustomizationModal
          plant={selectedPlant || undefined}
          userPlant={userPlant || undefined}
          onClose={closeModal}
          onSave={handleSave}
          displayUserPlantData={true}
          isAddingNewPlant={isAddingNewPlant}
        />
      )}
    </ThemedView>
  );
};

export default PlantSearchScreen;
