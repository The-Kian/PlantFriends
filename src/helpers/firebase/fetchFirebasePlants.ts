import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "@react-native-firebase/firestore";

import { IPlant } from "@/constants/IPlant";

async function fetchFirebasePlants(plantName: string): Promise<IPlant[]> {
  try {
    if (!plantName.trim()) {
      return [];
    }

    const db = getFirestore();
    const slugQuery = plantName.toLowerCase();

    // Query by slug field which is normalized to lowercase on all documents
    const q = query(
      collection(db, "Plants"),
      where("slug", ">=", slugQuery),
      where("slug", "<=", slugQuery + "\uf8ff"),
    );

    const snapshot = await getDocs(q);
    console.log(
      `Firestore search for "${plantName}": ${snapshot.docs.length} results`,
    );

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as IPlant),
      id: doc.id,
    })) as IPlant[];
  } catch (error) {
    console.error("Error fetching Firebase plants:", error);
    throw error;
  }
}

export default fetchFirebasePlants;
