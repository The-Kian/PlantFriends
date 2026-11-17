import { getFirestore, updateDoc } from "@react-native-firebase/firestore";

import { IUserPlant } from "@/constants/IPlant";
import { plantDoc } from "@/helpers/firebase/householdPaths";
import { calculateNextWateringDate } from "@/helpers/plants/wateringCalculations";
import ErrorService from "@/services/ErrorService";

/**
 * Records a watering, and who did it. Writes only the watering fields, so
 * an edit a housemate makes at the same time isn't overwritten.
 *
 * The updated plant comes back at once so the screen can respond straight
 * away: Firestore applies the write locally and keeps it queued while the
 * phone is offline, so waiting for the server would leave a dead connection
 * looking like a frozen button. If the server later refuses the write, the
 * user is told, and the plants listener puts the plant back as it was.
 */
function logWatering(
  householdId: string,
  plant: IUserPlant,
  waterer: { uid: string; displayName: string | null },
  frequencyDays: number
): IUserPlant {
  const now = Date.now();
  const watering = {
    last_watered_date: now,
    next_watering_date: calculateNextWateringDate(now, frequencyDays),
    last_watered_by: waterer.uid,
    last_watered_by_name: waterer.displayName,
  };

  updateDoc(plantDoc(getFirestore(), householdId, plant.id), watering).catch(
    (error: unknown) => {
      ErrorService.handleError(error, "Log Watering", {
        userMessage: "Failed to log watering. Please try again.",
      });
    }
  );

  return { ...plant, ...watering };
}

export default logWatering;
