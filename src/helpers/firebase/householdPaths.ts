import { collection, doc, getFirestore } from "@react-native-firebase/firestore";

// Firestore paths for household data, kept in one place.
//   Households/{householdId}
//   Households/{householdId}/Plants/{userPlantId}

type Db = ReturnType<typeof getFirestore>;

export const householdDoc = (db: Db, householdId: string) =>
  doc(collection(db, "Households"), householdId);

export const plantsCol = (db: Db, householdId: string) =>
  collection(householdDoc(db, householdId), "Plants");

export const plantDoc = (db: Db, householdId: string, userPlantId: string) =>
  doc(plantsCol(db, householdId), userPlantId);

export const userDoc = (db: Db, uid: string) => doc(collection(db, "Users"), uid);

/**
 * Whether a document snapshot exists. RN Firebase v22 exposes `exists()` as
 * a method; the Jest mock (and older snapshots) use a boolean property.
 */
export function docExists(
  snapshot: { exists: boolean | (() => boolean) } | null | undefined,
): boolean {
  if (!snapshot) return false;
  return typeof snapshot.exists === "function"
    ? snapshot.exists()
    : Boolean(snapshot.exists);
}
