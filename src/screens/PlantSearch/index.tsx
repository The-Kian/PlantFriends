import { NavigationProp } from "@react-navigation/native";
import React, { useState, useContext, useEffect } from "react";

import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

import { RootStackParamList } from "@/components/navigation/types";
import PlantCustomizationModal from "@/components/plant/CustomizationModal";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import TextInputField from "@/components/ui/Input/TextInputField";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import ScreenHeader from "@/components/ui/Views/ScreenHeader";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { IUserPlant, IPlant } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import savePlantToFirebase from "@/helpers/firebase/savePlantToFirebase";
import { useCombinedPlantSearch } from "@/hooks/search/useCombinedPlantSearch";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

import styles from "./index.styles";
import PlantSearchResults from "./Results";

interface PlantSearchScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export const PlantSearchScreen = ({ navigation }: PlantSearchScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { plants, loading, error } = useCombinedPlantSearch(searchQuery);
  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);
  const { user } = useContext(AuthContext);
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
    if (isAddingNewPlant) {
      userData.plantId = plantData.id;
    }
    await savePlantToFirebase(userData, plantData, user);

    closeModal();
    navigation.navigate("Tab");
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
          <LoadingSpinner size="small" message={`Searching for ${searchQuery}`} />
        )}
        {error && (
          <ThemedText style={[styles.status, { color: colors.error }]}>
            Error fetching plants
          </ThemedText>
        )}
        <PlantSearchResults plants={plants} onSelectPlant={handleSelectPlant} />
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
