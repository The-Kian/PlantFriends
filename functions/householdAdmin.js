/**
 * Linking housemates by hand, until the app has invites. Pure functions that
 * work out the writes; functions/scripts/householdAdmin.js applies them.
 * Run from GitHub: Actions → "Link housemate".
 */

/** A short display name, matching the app's displayNameFor(). */
function displayNameFor({ displayName, email }) {
  return (
    (displayName && displayName.trim()) ||
    (email && email.split("@")[0]) ||
    "Plant friend"
  );
}

/**
 * The writes that add `uid` to a household: the member lists, every shared
 * plant's carers, and the person's own householdId.
 */
function linkWrites({ householdId, household, plants, uid, name }) {
  const memberIds = household.memberIds || [];
  if (memberIds.includes(uid)) {
    return null; // already a member
  }
  const plantUpdates = plants
    .filter((p) => p.data.shared && !(p.data.carerIds || []).includes(uid))
    .map((p) => ({
      id: p.id,
      update: { carerIds: [...(p.data.carerIds || []), uid] },
    }));
  return {
    household: {
      memberIds: [...memberIds, uid],
      members: { ...(household.members || {}), [uid]: { displayName: name } },
    },
    plantUpdates,
    user: { householdId },
  };
}

/**
 * The writes that take `uid` out of a household. Plants only they looked
 * after become shared with whoever is left, so none is left with no carer.
 * Their own householdId is cleared; the app then sets them up a household
 * of their own again.
 */
function unlinkWrites({ household, plants, uid }) {
  const memberIds = household.memberIds || [];
  if (!memberIds.includes(uid)) {
    return null; // not a member
  }
  const remaining = memberIds.filter((id) => id !== uid);
  if (remaining.length === 0) {
    throw new Error("Can't remove the last member of a household.");
  }
  const members = { ...(household.members || {}) };
  delete members[uid];

  const plantUpdates = [];
  for (const p of plants) {
    const carerIds = p.data.carerIds || [];
    if (!carerIds.includes(uid)) continue;
    const left = carerIds.filter((id) => id !== uid);
    plantUpdates.push({
      id: p.id,
      update: left.length > 0 ? { carerIds: left } : { carerIds: remaining, shared: true },
    });
  }
  return {
    household: { memberIds: remaining, members },
    plantUpdates,
    clearUserHousehold: true,
  };
}

module.exports = { displayNameFor, linkWrites, unlinkWrites };
