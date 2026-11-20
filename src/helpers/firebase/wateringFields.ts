import { calculateNextWateringDate } from "@/helpers/plants/wateringCalculations";

export interface Waterer {
  uid: string;
  displayName: string | null;
}

/** The fields a watering writes, so the screen can show the result at once. */
export function wateringFields(
  now: number,
  waterer: Waterer,
  frequencyDays: number,
) {
  return {
    last_watered_date: now,
    next_watering_date: calculateNextWateringDate(now, frequencyDays),
    last_watered_by: waterer.uid,
    last_watered_by_name: waterer.displayName,
  };
}
