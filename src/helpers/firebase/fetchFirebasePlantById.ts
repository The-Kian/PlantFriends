import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

import { IPlant } from '@/constants/IPlant';

async function fetchFirebasePlantById(plantId: string): Promise<IPlant | null> {
  try {
    if (!plantId) return null;

    const db = getFirestore();
    const plantRef = doc(db, 'Plants', plantId);
    const snap = await getDoc(plantRef);

    if (!snap || !snap.exists) return null;

    return {
      ...(snap.data() as IPlant),
      id: snap.id,
    } as IPlant;
  } catch (error) {
    console.error('Error fetching plant by id:', error);
    return null;
  }
}

export default fetchFirebasePlantById;
