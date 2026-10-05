import { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { IHousehold, IUserPlant, IPlant } from "@/constants/IPlant";
import ErrorService from "@/services/ErrorService";


import saveBasePlantToFirebase from "./saveToFirebase/saveBasePlantToFirebase";
import saveUserPlantToFirebase from "./saveToFirebase/saveUserPlantToFirebase";

const savePlantToFirebase = async (
  userPlant: IUserPlant,
  plantData: IPlant,
  user: FirebaseAuthTypes.User | null,
  household: Pick<IHousehold, "id" | "memberIds"> | null,
): Promise<IUserPlant | null> => {
  if (!user) {
    ErrorService.handleError("User is not authenticated", "Save Plant");
    return null;
  }
  if (!household) {
    ErrorService.handleError("Household is not loaded yet", "Save Plant");
    return null;
  }

  try {
    const basePlantSaved = await saveBasePlantToFirebase(plantData, user);
    if (!basePlantSaved) {
      ErrorService.handleError("Failed to save base plant", "Save Plant");
      return null;
    }

    const userPlantSaved = await saveUserPlantToFirebase(
      userPlant,
      user,
      household,
    );
    if (!userPlantSaved) {
      ErrorService.handleError("Failed to save user plant", "Save Plant");
      return null;
    }

    return userPlant;
  } catch (error) {
    ErrorService.handleError(error, "Save Plant");
    return null;
  }
};

export default savePlantToFirebase;
