import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
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
    await firestore()
      .collection("Users")
      .doc(user.uid)
      .collection("UserPlants")
      .doc(userPlantId)
      .delete();
    return true;
  } catch (error) {
    console.error("removeUserPlantFromFirebase: Error deleting user plant:", error);
    return false;
  }
};

export default removeUserPlantFromFirebase;
