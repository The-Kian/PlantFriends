/**
 * What happens to a shared household's plants when a member deletes their
 * account. The household and its plants stay with the remaining members.
 */

/**
 * The update for one plant when `uid` leaves, or null if it doesn't change.
 *
 * - They stop being a carer.
 * - A plant only they looked after passes to the remaining members as a
 *   shared plant, so it isn't left with nobody to remind.
 * - Their uid and name are removed from "added by" and "watered by".
 */
function plantUpdateOnLeave(plant, uid, remainingMemberIds) {
  const update = {};
  const carerIds = plant.carerIds || [];

  if (carerIds.includes(uid)) {
    const remainingCarers = carerIds.filter((id) => id !== uid);
    if (remainingCarers.length > 0) {
      update.carerIds = remainingCarers;
    } else {
      update.carerIds = [...remainingMemberIds];
      update.shared = true;
    }
  }
  if (plant.addedBy === uid) {
    update.addedBy = null;
    update.userId = null;
  } else if (plant.userId === uid) {
    update.userId = null;
  }
  if (plant.last_watered_by === uid) {
    update.last_watered_by = null;
    update.last_watered_by_name = null;
  }

  return Object.keys(update).length > 0 ? update : null;
}

module.exports = { plantUpdateOnLeave };
