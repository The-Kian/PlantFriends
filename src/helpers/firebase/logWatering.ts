import { getFirestore, updateDoc } from "@react-native-firebase/firestore";

import { IUserPlant } from "@/constants/IPlant";
import { plantDoc } from "@/helpers/firebase/householdPaths";
import { QueuedWriteHooks, queuedWrite } from "@/helpers/firebase/queuedWrite";
import { Waterer, wateringFields } from "@/helpers/firebase/wateringFields";

interface LogWateringOptions extends QueuedWriteHooks {
  /** When it happened, if the caller already showed the result. */
  now?: number;
}

/**
 * Records a watering, and who did it. Writes only the watering fields, so
 * an edit a housemate makes at the same time isn't overwritten. Resolves
 * once the server has it, or after a short wait if the phone is offline (the
 * write carries on in the background; see the hooks).
 */
async function logWatering(
  householdId: string,
  plant: IUserPlant,
  waterer: Waterer,
  frequencyDays: number,
  { now = Date.now(), onWaiting, onSynced }: LogWateringOptions = {},
): Promise<IUserPlant> {
  const watering = wateringFields(now, waterer, frequencyDays);
  await queuedWrite(
    updateDoc(plantDoc(getFirestore(), householdId, plant.id), watering),
    "Log watering",
    undefined,
    { onWaiting, onSynced },
  );
  return { ...plant, ...watering };
}

export default logWatering;
