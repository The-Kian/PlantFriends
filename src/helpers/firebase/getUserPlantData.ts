import {
  getDocs,
  getFirestore,
  query,
  where,
} from "@react-native-firebase/firestore";

import { IUserPlant } from "@/constants/IPlant";
import { plantsCol } from "@/helpers/firebase/householdPaths";

/**
 * Finds the plant of this species that `userId` added to the household.
 * Matching on `addedBy` as well as `plantId` means a housemate's plant of
 * the same species is never returned.
 */
async function getUserPlantData(
  householdId: string,
  userId: string,
  plantId: string,
): Promise<IUserPlant | undefined> {
  const q = query(
    plantsCol(getFirestore(), householdId),
    where("plantId", "==", plantId),
    where("addedBy", "==", userId),
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].data() as IUserPlant;
  }
  return undefined;
}

export default getUserPlantData;
