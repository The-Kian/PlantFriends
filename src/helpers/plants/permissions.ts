import { IUserPlant } from "@/constants/IPlant";

/**
 * Who may change or remove a household plant. Mirrors `isCarer` and the
 * Plants rules in firestore.rules, so the app hides what the rules would
 * refuse. Keep the two in step.
 *
 * - Whoever added a plant, and its carers, may edit and delete it.
 * - Any other member may log a watering on a shared plant, and delete it.
 * - A housemate's personal plant is theirs alone.
 */
export function isCarer(plant: IUserPlant, uid: string | undefined): boolean {
  if (!uid) return false;
  return plant.addedBy === uid || (plant.carerIds ?? []).includes(uid);
}

export function canEditPlant(
  plant: IUserPlant,
  uid: string | undefined
): boolean {
  return isCarer(plant, uid);
}

export function canRemovePlant(
  plant: IUserPlant,
  uid: string | undefined
): boolean {
  return isCarer(plant, uid) || (Boolean(uid) && plant.shared === true);
}
