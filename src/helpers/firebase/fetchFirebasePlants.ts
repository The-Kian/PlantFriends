import firestore from "@react-native-firebase/firestore";

import { IPlant } from "@/constants/IPlant";

async function fetchFirebasePlants(plantName: string): Promise<IPlant[]> {
  const plantsRef = firestore().collection("Plants");

  const snapshot = await plantsRef
    .where("name", ">=", plantName)
    .where("name", "<=", plantName + "\uf8ff")
    .get();

  if (!snapshot.empty) {
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IPlant[];
  }
  return [];
}

export default fetchFirebasePlants;
