import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "@react-native-firebase/firestore";

import { IPlant } from "@/constants/IPlant";

const saveBasePlantToFirebase = async (
  plantData: IPlant,
  user: FirebaseAuthTypes.User,
): Promise<boolean> => {
  const plantId = plantData.id;
  const db = getFirestore();
  const plantRef = doc(collection(db, "Plants"), plantId);
  const plantDoc = await getDoc(plantRef);

  // Save the base plant data if it doesn't exist
  if (!plantDoc.exists) {
    try {
      const basePlantData = {
        ...plantData,
        contributed_by: user.displayName ?? user.email ?? user.uid,
        isVerified: plantData.isVerified ?? false,
        slug: plantData.name ? plantData.name.toLowerCase() : "",
      };
      await setDoc(plantRef, basePlantData);
    } catch (error) {
      console.error("Error saving base plant data: ", error);
      return false;
    }
  }
  return true;
};

export default saveBasePlantToFirebase;
