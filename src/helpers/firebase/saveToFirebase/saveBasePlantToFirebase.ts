import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "@react-native-firebase/firestore";

import { IPlant } from "@/constants/IPlant";
import { docExists } from "@/helpers/firebase/householdPaths";
import { queuedWrite } from "@/helpers/firebase/queuedWrite";
import { recordHandledError } from "@/services/CrashReporting";

const saveBasePlantToFirebase = async (
  plantData: IPlant,
  user: FirebaseAuthTypes.User,
): Promise<boolean> => {
  const plantId = plantData.id;
  const db = getFirestore();
  const plantRef = doc(collection(db, "Plants"), plantId);
  const plantDoc = await getDoc(plantRef);

  // Save the base plant data if it doesn't exist. `exists` is a method on
  // the modular API, so reading it as a property is always truthy and the
  // species was never saved; docExists handles both forms.
  if (!docExists(plantDoc)) {
    try {
      // The catalog rule only accepts plants a client contributes as
      // unverified, and rejects null values (Trefle sends null for unknown
      // temperatures and the like), so drop those fields.
      const basePlantData = Object.fromEntries(
        Object.entries({
          ...plantData,
          contributed_by: user.displayName ?? user.email ?? user.uid,
          isVerified: false,
          slug: plantData.name ? plantData.name.toLowerCase() : "",
        }).filter(([, value]) => value !== null && value !== undefined),
      );
      await queuedWrite(setDoc(plantRef, basePlantData), "Save base plant");
    } catch (error) {
      console.error("Error saving base plant data: ", error);
      recordHandledError(error, "Save base plant");
      return false;
    }
  }
  return true;
};

export default saveBasePlantToFirebase;
