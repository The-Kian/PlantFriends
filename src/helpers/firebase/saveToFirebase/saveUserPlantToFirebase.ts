import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  setDoc,
} from "@react-native-firebase/firestore";

import uuid from "react-native-uuid";

import { IUserPlant, IPlant } from "@/constants/IPlant";

const saveUserPlantToFirebase = async (
  userPlant: IUserPlant,
  user: FirebaseAuthTypes.User,
): Promise<boolean> => {
  const userPlantId = userPlant.id ?? uuid.v4().toString();
  const userPlantData: IUserPlant = {
    ...userPlant,
    id: userPlantId,
    userId: user.uid,
    plantId: userPlant.plantId,
  };

  try {
    const db = getFirestore();

    // Derive a searchable slug for user plants. Prefer a custom name
    // (user-provided), otherwise fall back to any base name in custom_attributes.
    const derivedName =
      (userPlant.custom_name && userPlant.custom_name.trim()) ||
      (userPlant.custom_attributes &&
        (userPlant.custom_attributes as Partial<IPlant>).name) ||
      "";

    const docData = {
      ...userPlantData,
      slug: derivedName ? derivedName.toLowerCase() : "",
    };

    const userPlantRef = doc(
      collection(doc(collection(db, "Users"), user.uid), "UserPlants"),
      userPlantId,
    );
    await setDoc(userPlantRef, docData);
    return true;
  } catch (error) {
    console.error(
      "saveUserPlantToFirebase: Error saving user plant data: ",
      error,
    );
    return false;
  }
};

export default saveUserPlantToFirebase;
