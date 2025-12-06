import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

import { IPlant } from "@/constants/IPlant";

const saveBasePlantToFirebase = async (
  plantData: IPlant,
  user: FirebaseAuthTypes.User,
): Promise<boolean> => {
  const plantId = plantData.id;
  const plantRef = firestore().collection("Plants").doc(plantId);
  const plantDoc = await plantRef.get();

  // Save the base plant data if it doesn't exist
  if (!plantDoc.exists) {
    try {
      const basePlantData = {
        ...plantData,
        contributed_by: user.displayName ?? user.email ?? user.uid,
        isVerified: plantData.isVerified ?? false,
      };
      await plantRef.set(basePlantData);
    } catch (error) {
      console.error("Error saving base plant data: ", error);
      return false;
    }
  }
  return true;
};

export default saveBasePlantToFirebase;
