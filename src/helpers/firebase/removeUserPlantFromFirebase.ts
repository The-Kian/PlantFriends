import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { deleteDoc, getFirestore } from "@react-native-firebase/firestore";

import { plantDoc } from "@/helpers/firebase/householdPaths";
import ErrorService from "@/services/ErrorService";

const removeUserPlantFromFirebase = async (
  userPlantId: string,
  user: FirebaseAuthTypes.User | null,
  householdId: string | null,
): Promise<boolean> => {
  if (!user || !householdId) {
    ErrorService.handleError("User is not authenticated", "Remove Plant");
    return false;
  }

  try {
    await deleteDoc(plantDoc(getFirestore(), householdId, userPlantId));
    return true;
  } catch (error) {
    ErrorService.handleError(error, "Remove Plant");
    return false;
  }
};

export default removeUserPlantFromFirebase;
