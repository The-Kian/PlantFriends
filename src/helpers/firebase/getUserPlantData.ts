import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  where,
} from "@react-native-firebase/firestore";

import { IUserPlant } from "@/constants/IPlant";

async function getUserPlantData(
  userId: string,
  plantId: string,
): Promise<IUserPlant | undefined> {
  const db = getFirestore();
  const q = query(
    collection(doc(collection(db, "Users"), userId), "UserPlants"),
    where("plantId", "==", plantId),
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].data() as IUserPlant;
  }
  return undefined;
}

export default getUserPlantData;
