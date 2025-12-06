import {
  collection,
  doc,
  getDocs,
  getFirestore,
} from "@react-native-firebase/firestore";

import { IUserPlant } from "@/constants/IPlant";

async function fetchUserPlants(userId: string): Promise<IUserPlant[]> {
  const db = getFirestore();
  const userPlantsRef = collection(doc(collection(db, "Users"), userId), "UserPlants");

  const snapshot = await getDocs(userPlantsRef);

  if (!snapshot.empty) {
    return snapshot.docs.map((doc) => doc.data() as IUserPlant);
  }
  return [];
}

export default fetchUserPlants;
