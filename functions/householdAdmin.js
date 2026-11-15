/**
 * Pure functions that work out household writes (joining, leaving, removing,
 * account deletion). The callable functions in households.js apply them.
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
 * The plants someone brings with them when they join a household. They stay
 * theirs: the same document ID and data, as personal plants that only they
 * look after.
 */
function moveWrites({ plants, uid }) {
  return plants.map((p) => ({
    id: p.id,
    data: { ...p.data, addedBy: uid, userId: uid, carerIds: [uid], shared: false },
  }));
}

/**
 * The writes that take `uid` out of a household. Plants only they looked
 * after become shared with whoever is left, so none is left with no carer.
 * If they set the household up, it passes to the longest-standing member
 * (the first left in `memberIds`, which only ever has people appended).
 *
 * Used by leaving, removing a member and deleting an account. Leaving and
 * removing then give them a household of their own (functions/households.js);
 * leaving clears their householdId through the callable functions.
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
  const householdUpdate = { memberIds: remaining, members };
  if (household.createdBy === uid) {
    householdUpdate.createdBy = remaining[0];
  }
  return {
    household: householdUpdate,
    plantUpdates,
    clearUserHousehold: true,
  };
}

module.exports = { displayNameFor, linkWrites, moveWrites, unlinkWrites };
