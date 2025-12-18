import { IUserPlant, IPlant, IUserPlantMerged } from "@/constants/IPlant";

/**
 * Converts Firestore Timestamp objects to JavaScript Dates in serializable form.
 * Firestore returns { seconds, nanoseconds } objects that Redux can't serialize.
 */
export function serializeTimestamps<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    // Check for Firestore Timestamp-like object: { seconds, nanoseconds }
    if (
      value &&
      typeof value === "object" &&
      "seconds" in value &&
      typeof (value as Record<string, unknown>).seconds === "number"
    ) {
      const timestamp = value as { seconds: number; nanoseconds: number };
      // Convert to ISO string (serializable)
      result[key] = new Date(timestamp.seconds * 1000).toISOString() as unknown as T[Extract<
        keyof T,
        string
      >];
    }
  }

  return result;
}

/**
 * Normalizes a user plant by converting Firestore Timestamps to ISO strings.
 * This ensures Redux can serialize the state without warnings.
 */
export function normalizeUserPlant(plant: IUserPlant): IUserPlant {
  return serializeTimestamps(plant);
}

/**
 * Normalizes an array of user plants for Redux storage.
 */
export function normalizeUserPlants(
  plants: (IUserPlant | IUserPlantMerged)[],
): (IUserPlant | IUserPlantMerged)[] {
  return plants.map((plant) => serializeTimestamps(plant));
}
