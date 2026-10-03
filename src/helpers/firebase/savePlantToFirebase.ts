import { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { Alert } from "react-native";
import ErrorService from "@/services/ErrorService";

import { IUserPlant, IPlant } from "@/constants/IPlant";

import saveBasePlantToFirebase from "./saveToFirebase/saveBasePlantToFirebase";
import saveUserPlantToFirebase from "./saveToFirebase/saveUserPlantToFirebase";

const savePlantToFirebase = async (
  userPlant: IUserPlant,
  plantData: IPlant,
  user: FirebaseAuthTypes.User | null,
) => {
  if (!user) {
    ErrorService.handleError("User is not authenticated", "Save Plant");
    return;
  }

  const basePlantSaved = await saveBasePlantToFirebase(plantData, user);
  if (!basePlantSaved) {
    ErrorService.handleError("Failed to save base plant", "Save Plant");
    return;
  }

  const userPlantSaved = await saveUserPlantToFirebase(userPlant, user);
  if (!userPlantSaved) {
    ErrorService.handleError("Failed to save user plant", "Save Plant");
  }

  return userPlant;
};

export default savePlantToFirebase;
