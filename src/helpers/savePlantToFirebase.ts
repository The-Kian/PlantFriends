
import { IUserPlant, IPlant } from "@constants/IPlant";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { Alert } from "react-native";

import saveBasePlantToFirebase from "./saveToFirebase/saveBasePlantToFirebase";
import saveUserPlantToFirebase from "./saveToFirebase/saveUserPlantToFirebase";

const savePlantToFirebase = async (
  userPlant: IUserPlant,
  plantData: IPlant,
  user: FirebaseAuthTypes.User | null
) => {
  if (!user) {
    console.error("User is not authenticated.");
    Alert.alert("Error", "User is not authenticated.");
    return;
  }

  const basePlantSaved = await saveBasePlantToFirebase(plantData, user);
  if (!basePlantSaved) {
    console.error("Failed to save base plant.");
    return;
  }

  const userPlantSaved = await saveUserPlantToFirebase(userPlant, user);
  if (!userPlantSaved) {
    console.error("Failed to save user plant.");
  }
};

export default savePlantToFirebase;
