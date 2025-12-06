import firestore from "@react-native-firebase/firestore";

import { IPlant } from "@/constants/IPlant";

function getFirestoreInstance() {
  try {
    // Use getApp() when available to avoid namespaced-deprecation warnings at runtime.
    // Use require to avoid breaking Jest module resolution in tests.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getApp } = require("@react-native-firebase/app");
    return firestore(getApp());
  } catch (err) {
    console.warn(err)
    return firestore();
  }
}

async function fetchFirebasePlants(plantName: string): Promise<IPlant[]> {
  const plantsRef = getFirestoreInstance().collection("Plants");

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
