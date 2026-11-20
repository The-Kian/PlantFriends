import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore";

import { IPlant } from "@/constants/IPlant";
import { isOfflineError } from "@/helpers/errors/friendlyErrors";
import { docExists } from "@/helpers/firebase/householdPaths";
import { recordHandledError } from "@/services/CrashReporting";

/**
 * Loads a species by ID. Resolves to null when there is no such species, and
 * throws when the lookup itself fails (offline, say), so callers can tell
 * "doesn't exist" from "couldn't check" and try again later.
 *
 * This runs in the background for every plant, so it never shows an alert.
 */
async function fetchFirebasePlantById(plantId: string): Promise<IPlant | null> {
  if (!plantId) return null;

  try {
    const db = getFirestore();
    const plantRef = doc(db, "Plants", plantId);
    const snap = await getDoc(plantRef);

    if (!docExists(snap)) return null;

    return {
      ...(snap.data() as IPlant),
      id: snap.id,
    } as IPlant;
  } catch (error) {
    // Being offline isn't a fault worth reporting.
    if (!isOfflineError(error)) {
      recordHandledError(error, "Fetch Plant By ID");
    }
    throw error;
  }
}

export default fetchFirebasePlantById;
