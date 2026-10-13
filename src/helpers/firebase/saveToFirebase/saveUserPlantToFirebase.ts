import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { getDoc, getFirestore, setDoc } from "@react-native-firebase/firestore";

import uuid from "react-native-uuid";

import { IHousehold, IUserPlant, IPlant } from "@/constants/IPlant";
import { docExists, plantDoc } from "@/helpers/firebase/householdPaths";

/**
 * Creates or updates a plant in the household. On create it records who
 * added it; on update it leaves that alone (the security rules don't allow
 * `addedBy` to change).
 */
const saveUserPlantToFirebase = async (
  userPlant: IUserPlant,
  user: FirebaseAuthTypes.User,
  household: Pick<IHousehold, "id">,
): Promise<boolean> => {
  const userPlantId = userPlant.id ?? uuid.v4().toString();

  try {
    const db = getFirestore();
    const ref = plantDoc(db, household.id, userPlantId);
    const exists = docExists(await getDoc(ref));

    // Derive a searchable slug for user plants. Prefer a custom name
    // (user-provided), otherwise fall back to any base name in custom_attributes.
    const derivedName =
      (userPlant.custom_name && userPlant.custom_name.trim()) ||
      (userPlant.custom_attributes &&
        (userPlant.custom_attributes as Partial<IPlant>).name) ||
      "";

    const { addedBy: _addedBy, ...fields } = userPlant;
    const docData: Partial<IUserPlant> & { slug: string } = {
      ...fields,
      id: userPlantId,
      plantId: userPlant.plantId,
      slug: derivedName ? derivedName.toLowerCase() : "",
    };

    if (!exists) {
      Object.assign(docData, {
        addedBy: user.uid,
        userId: user.uid,
        carerIds: [user.uid],
        shared: false,
      });
    }

    await setDoc(ref, docData, { merge: true });
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
