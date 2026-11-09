import { getFirestore, updateDoc } from "@react-native-firebase/firestore";

import { IUserPlant } from "@/constants/IPlant";
import { plantDoc } from "@/helpers/firebase/householdPaths";
import { calculateNextWateringDate } from "@/helpers/plants/wateringCalculations";

/**
 * Records a watering, and who did it. Writes only the watering fields, so
 * an edit a housemate makes at the same time isn't overwritten.
 */
async function logWatering(
  householdId: string,
  plant: IUserPlant,
  waterer: { uid: string; displayName: string | null },
  frequencyDays: number,
): Promise<IUserPlant> {
  const now = Date.now();
  const watering = {
    last_watered_date: now,
    next_watering_date: calculateNextWateringDate(now, frequencyDays),
    last_watered_by: waterer.uid,
    last_watered_by_name: waterer.displayName,
  };
  await updateDoc(plantDoc(getFirestore(), householdId, plant.id), watering);
  return { ...plant, ...watering };
}

export default logWatering;
