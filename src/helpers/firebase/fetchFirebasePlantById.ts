import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

import { IPlant } from '@/constants/IPlant';
import { isOfflineError } from '@/helpers/errors/friendlyErrors';
import { docExists } from '@/helpers/firebase/householdPaths';
import { recordHandledError } from '@/services/CrashReporting';

/**
 * Loads a species from the catalogue. Resolves to null when there is no such
 * species. Rejects when it couldn't be fetched (offline, say), so callers
 * don't remember a failure as "no such species". This runs in the background
 * for every plant, so it logs but never shows an alert.
 */
async function fetchFirebasePlantById(plantId: string): Promise<IPlant | null> {
  if (!plantId) return null;

  try {
    const db = getFirestore();
    const plantRef = doc(db, 'Plants', plantId);
    const snap = await getDoc(plantRef);

    if (!docExists(snap)) return null;

    return {
      ...(snap.data() as IPlant),
      id: snap.id,
    } as IPlant;
  } catch (error) {
    console.warn('Fetch Plant By ID failed:', error);
    if (!isOfflineError(error)) recordHandledError(error, 'Fetch Plant By ID');
    throw error;
  }
}

export default fetchFirebasePlantById;
