import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
} from "@react-native-firebase/firestore";

import { Alert } from "react-native";

const removeUserPlantFromFirebase = async (
  userPlantId: string,
  user: FirebaseAuthTypes.User | null,
): Promise<boolean> => {
  if (!user) {
    console.error("removeUserPlantFromFirebase: User not authenticated");
    Alert.alert("Error", "User is not authenticated.");
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
    console.error("removeUserPlantFromFirebase: Error deleting user plant:", error);
    return false;
  }
};

export default removeUserPlantFromFirebase;
