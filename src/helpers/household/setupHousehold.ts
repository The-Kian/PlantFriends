import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "@react-native-firebase/firestore";

import {
  docExists,
  householdDoc,
  plantDoc,
  userDoc,
} from "@/helpers/firebase/householdPaths";

// Firestore allows 500 writes per batch; leave room for the user doc write.
const BATCH_SIZE = 400;

/** A short name for the person, for "Kian's home" and "watered by Kian". */
export function displayNameFor(user: FirebaseAuthTypes.User): string {
  return (
    user.displayName?.trim() || user.email?.split("@")[0] || "Plant friend"
  );
}

/** The device's IANA time zone, e.g. "Europe/London". */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Gives a user a household of their own. Its ID is their uid, so running
 * this twice (or on two devices at once) can't create two households.
 * Housemates are linked by hand for now: see docs/household-sharing-plan.md.
 */
export async function createSoloHousehold(
  user: FirebaseAuthTypes.User,
): Promise<string> {
  const db = getFirestore();
  const householdId = user.uid;
  const ref = householdDoc(db, householdId);

  if (!docExists(await getDoc(ref))) {
    const name = displayNameFor(user);
    await setDoc(ref, {
      name: `${name}'s home`,
      memberIds: [user.uid],
      members: { [user.uid]: { displayName: name } },
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      timeZone: deviceTimeZone(),
    });
  }

  await setDoc(userDoc(db, user.uid), { householdId }, { merge: true });
  return householdId;
}

/**
 * One-off copy of a user's plants from `Users/{uid}/UserPlants` (where older
 * builds kept them) into their household. The old collection is kept for
 * one release in case a rollback is needed.
 */
export async function migrateUserPlants(
  user: FirebaseAuthTypes.User,
  householdId: string,
): Promise<number> {
  const db = getFirestore();
  const oldPlants = await getDocs(
    collection(userDoc(db, user.uid), "UserPlants"),
  );
  const docs = oldPlants.docs ?? [];

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const snap of docs.slice(i, i + BATCH_SIZE)) {
      batch.set(
        plantDoc(db, householdId, snap.id),
        {
          ...snap.data(),
          id: snap.id,
          userId: user.uid,
          addedBy: user.uid,
          carerIds: [user.uid],
          shared: false,
        },
        { merge: true },
      );
    }
    await batch.commit();
  }

  await setDoc(
    userDoc(db, user.uid),
    { plantsMigratedAt: serverTimestamp() },
    { merge: true },
  );
  return docs.length;
}
