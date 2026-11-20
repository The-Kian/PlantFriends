import { IUserPlant } from "@/constants/IPlant";

/**
 * Who may change or remove a household plant. This mirrors firestore.rules
 * (`looksAfter`, and the delete rule), so the app hides what the rules would
 * refuse. Keep the two in step.
 *
 * - A personal plant belongs to whoever added it and to its carers.
 * - Any member may remove a shared plant, but only a carer may edit it.
 * - A plant with no `addedBy` is old data that any member may change.
 */

/** Added it, or one of its carers (or old data with no owner). */
export function looksAfter(plant: IUserPlant, uid: string | undefined): boolean {
  if (!uid) return false;
  if (plant.addedBy === undefined || plant.addedBy === null) return true;
  return plant.addedBy === uid || (plant.carerIds ?? []).includes(uid);
}

export function canEditPlant(plant: IUserPlant, uid: string | undefined): boolean {
  return looksAfter(plant, uid);
}

export function canRemovePlant(
  plant: IUserPlant,
  uid: string | undefined,
): boolean {
  return Boolean(uid) && (looksAfter(plant, uid) || plant.shared === true);
}
