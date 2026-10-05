import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { getDoc, getFirestore, setDoc } from "@react-native-firebase/firestore";

import uuid from "react-native-uuid";

import { IHousehold, IUserPlant, IPlant } from "@/constants/IPlant";
import { docExists, plantDoc } from "@/helpers/firebase/householdPaths";

// Fields a person can edit on a plant. Anything else on the in-memory object
// (merged species data, server-only notification fields) is never written.
const EDITABLE_FIELDS = [
  "plantId",
  "custom_attributes",
  "custom_name",
  "date_added",
  "reminders_enabled",
  "custom_watering_schedule",
  "custom_notes",
  "location",
  "houseLocation",
  "is_favorite",
  "shared",
] as const satisfies readonly (keyof IUserPlant)[];

// Only written when the plant is first added. After that, watering goes
// through logWatering() so an edit can't undo a housemate's watering.
const CREATE_ONLY_FIELDS = [
  "last_watered_date",
  "next_watering_date",
  "last_watered_by",
  "last_watered_by_name",
] as const satisfies readonly (keyof IUserPlant)[];

function pick<K extends keyof IUserPlant>(
  source: IUserPlant,
  fields: readonly K[],
): Partial<IUserPlant> {
  const result: Partial<IUserPlant> = {};
  for (const field of fields) {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }
  }
  return result;
}

/** Who looks after a plant: the whole household if shared, else whoever added it. */
export function carersFor(
  shared: boolean,
  addedBy: string,
  household: Pick<IHousehold, "memberIds">,
): string[] {
  return shared ? [...household.memberIds] : [addedBy];
}

/**
 * Creates or updates a plant in the household. On create it records who
 * added it. On update it never changes ownership, so saving a housemate's
 * plant doesn't make it yours.
 */
const saveUserPlantToFirebase = async (
  userPlant: IUserPlant,
  user: FirebaseAuthTypes.User,
  household: Pick<IHousehold, "id" | "memberIds">,
): Promise<boolean> => {
  const userPlantId = userPlant.id ?? uuid.v4().toString();

  try {
    const db = getFirestore();
    const ref = plantDoc(db, household.id, userPlantId);
    const existing = await getDoc(ref);
    const exists = docExists(existing);

    // Derive a searchable slug for user plants. Prefer a custom name
    // (user-provided), otherwise fall back to any base name in custom_attributes.
    const derivedName =
      (userPlant.custom_name && userPlant.custom_name.trim()) ||
      (userPlant.custom_attributes &&
        (userPlant.custom_attributes as Partial<IPlant>).name) ||
      "";

    const current = exists
      ? (existing.data() as IUserPlant | undefined)
      : undefined;
    // An edit that doesn't mention sharing keeps the plant as it was.
    const shared = userPlant.shared ?? current?.shared ?? false;
    const addedBy = current?.addedBy ?? user.uid;

    const docData: Partial<IUserPlant> & { slug: string } = {
      ...pick(userPlant, EDITABLE_FIELDS),
      id: userPlantId,
      shared,
      carerIds: carersFor(shared, addedBy, household),
      slug: derivedName ? derivedName.toLowerCase() : "",
    };

    if (!exists) {
      Object.assign(docData, pick(userPlant, CREATE_ONLY_FIELDS), {
        addedBy: user.uid,
        // Kept so existing code that reads userId keeps working.
        userId: user.uid,
      });
    }

    await setDoc(ref, docData, { merge: true });
    return true;
  } catch (error) {
    console.error(
      "saveUserPlantToFirebase: Error saving user plant data: ",
      error,
    );
    return false;
  }
};

export default saveUserPlantToFirebase;
