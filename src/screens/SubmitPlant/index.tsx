import React, { useContext } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

import PlantForm from "@components/plant/customization/PlantForm";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { IPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import saveBasePlantToFirebase from "@helpers/saveToFirebase/saveBasePlantToFirebase";

const SubmitPlantScreen = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleSave = async (basePlantData: IPlant) => {
    if (user) {
      await saveBasePlantToFirebase(basePlantData, user);
      navigation.goBack();
    } else {
      Alert.alert("You must be logged in to submit a plant");
    }
  };

  return (
    <ThemedView>
      <ThemedText>Submit Plant for review!</ThemedText>
      <PlantForm onSave={handleSave} displayUserPlantData={false}/>
    </ThemedView>
  );
};

export default SubmitPlantScreen;
