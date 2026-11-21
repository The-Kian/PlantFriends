import {
  FirebaseFirestoreTypes,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "@react-native-firebase/firestore";

import { IPlant } from "@/constants/IPlant";
import { isOfflineError } from "@/helpers/errors/friendlyErrors";
import { recordHandledError } from "@/services/CrashReporting";

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
      where("slug", "<=", slugQuery + "\uf8ff")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
        ...(doc.data() as IPlant),
        id: doc.id,
      })
    ) as IPlant[];
  } catch (error) {
    // Callers show the failure; this only reports it.
    if (!isOfflineError(error)) {
      recordHandledError(error, "Fetch Firebase Plants");
    }
    throw error;
  }
}

export default fetchFirebasePlants;
