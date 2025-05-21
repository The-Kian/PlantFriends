import { useNavigation } from "@react-navigation/native";
import React, { useContext } from "react";

import { Alert } from "react-native";

import PlantForm from "@components/plant/customization/PlantForm";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import { useUserPlantDataHandlers } from "@hooks/userPlantDataHandlers";

const SubmitPlantScreen = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const { handlePlantSubmit } = useUserPlantDataHandlers();

  const handleSave = async (basePlantData: IPlant) => {
    if (user) {
      // Create a basic userPlant object
      const userPlant: IUserPlant = {
        id: basePlantData.id,
        plantId: basePlantData.id,
        userId: user.uid,
        custom_name: basePlantData.name,
        location: "Unspecified",
      };

      await handlePlantSubmit(userPlant, basePlantData);
      navigation.goBack();
    } else {
      Alert.alert("You must be logged in to submit a plant");
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedText>Submit Plant for review!</ThemedText>
      <PlantForm onSave={handleSave} displayUserPlantData={false} />
    </ThemedView>
  );
};

export default SubmitPlantScreen;