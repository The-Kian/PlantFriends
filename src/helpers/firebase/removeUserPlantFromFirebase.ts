import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
} from "@react-native-firebase/firestore";

import { Alert } from "react-native";
import ErrorService from "@/services/ErrorService";

const removeUserPlantFromFirebase = async (
  userPlantId: string,
  user: FirebaseAuthTypes.User | null,
): Promise<boolean> => {
  if (!user) {
    ErrorService.handleError("User is not authenticated", "Remove Plant");
    return false;
  }

  try {
    const db = getFirestore();
    const userPlantRef = doc(
      collection(doc(collection(db, "Users"), user.uid), "UserPlants"),
      userPlantId,
    );
    await deleteDoc(userPlantRef);
    return true;
  } catch (error) {
    ErrorService.handleError(error, "Remove Plant");
    return false;
  }
};

export default removeUserPlantFromFirebase;
