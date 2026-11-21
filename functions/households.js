/**
 * Invites and joining a household. The handlers take plain arguments (a
 * Firestore, the caller's uid and so on) so they can be tested with a fake db;
 * the callable wrappers in index.js pass the real ones.
 *
 * Invites/{code} is written and read only here (see firestore.rules).
 */
const functions = require("firebase-functions/v1");
const admin = require("./admin");

const { generateCode, normaliseCode } = require("./inviteCode");
const { displayNameFor, linkWrites, moveWrites, unlinkWrites } = require("./householdAdmin");

const MAX_MEMBERS = 10;
const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const CODE_ATTEMPTS = 3;
// A household's live invites are capped at 3 (docs/qa-followup-plan.md, E).
// Making a new invite revokes all older ones (revokeOlderInvites), so there is
// normally just one and the cap holds without a separate check.

const { HttpsError } = functions.https;

// Firestore's "document already exists" error, as the Admin SDK reports it.
const isAlreadyExists = (error) =>
  Boolean(error) && (error.code === 6 || error.code === "already-exists");

/** The invite documents whose `field` equals `value`. */
async function invitesWhere(db, field, value) {
  return (await db.collection("Invites").where(field, "==", value).get()).docs;
}

/**
 * Revokes (deletes) every invite created by `uid`, so their codes stop
 * working when they leave, are removed or delete their account. A deleted
 * code gets the same "isn't valid or has expired" answer as an expired one.
 * (joinHouseholdHandler also refuses a code whose creator is no longer in the
 * household, as a second line of defence.)
 */
async function revokeInvitesBy(db, uid) {
  const docs = await invitesWhere(db, "createdBy", uid);
  await Promise.all(docs.map((d) => d.ref.delete()));
  return docs.length;
}

/**
 * After an invite is made: revokes the household's older invites (created
 * before this one, ties broken by code), so only the newest code works. That
 * keeps a household far under MAX_ACTIVE_INVITES. Two calls racing can't
 * revoke each other: each removes only what is older than itself.
 */
async function revokeOlderInvites(db, householdId, newCode, now) {
  const docs = await invitesWhere(db, "householdId", householdId);
  const older = docs.filter((d) => {
    if (d.id === newCode) return false;
    const at = d.get("createdAt");
    const created = at && at.toMillis ? at.toMillis() : 0;
    return created < now || (created === now && d.id < newCode);
  });
  await Promise.all(older.map((d) => d.ref.delete()));
}

/** Makes a new invite code for the caller's household. */
async function createInviteHandler({ db, uid, now }) {
  const userSnap = await db.doc(`Users/${uid}`).get();
  const householdId = (userSnap.exists && userSnap.get("householdId")) || uid;
  const householdSnap = await db.doc(`Households/${householdId}`).get();
  const household = householdSnap.exists ? householdSnap.data() : null;
  const memberIds = (household && household.memberIds) || [];
  if (!household || !memberIds.includes(uid)) {
    throw new HttpsError("permission-denied", "You're not in this household.");
  }
  if (memberIds.length >= MAX_MEMBERS) {
    throw new HttpsError("resource-exhausted", "This household is full.");
  }

  const expiresAt = admin.Timestamp.fromMillis(now + INVITE_LIFETIME_MS);
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const code = generateCode();
    try {
      // create() fails if the code exists, so an old invite is never overwritten.
      await db.doc(`Invites/${code}`).create({
        householdId,
        createdBy: uid,
        createdAt: admin.Timestamp.fromMillis(now),
        expiresAt,
      });
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      continue;
    }
    await revokeOlderInvites(db, householdId, code, now);
    return { code, expiresAt: expiresAt.toMillis(), householdName: household.name };
  }
  throw new HttpsError("internal", "Couldn't make an invite. Please try again.");
}

const plantsOf = (snap) => snap.docs.map((d) => ({ id: d.id, data: d.data() }));

/**
 * Joins the caller to the household an invite code belongs to. With
 * `data.preview` it runs every check and writes nothing, so the app can
 * show a confirmation.
 */
async function joinHouseholdHandler({ db, uid, authToken, data, now }) {
  const code = normaliseCode(data && data.code);
  if (!code) {
    throw new HttpsError("invalid-argument", "Codes are 8 letters and numbers.");
  }
  const preview = Boolean(data && data.preview === true);

  return db.runTransaction(async (transaction) => {
    // Firestore wants every read before any write.
    const inviteSnap = await transaction.get(db.doc(`Invites/${code}`));
    const invite = inviteSnap.exists ? inviteSnap.data() : null;
    const expired = !invite || !invite.expiresAt || invite.expiresAt.toMillis() <= now;

    const notFound = new HttpsError("not-found", "That code isn't valid or has expired.");
    if (expired) throw notFound;
    const householdId = invite.householdId;
    const householdRef = db.doc(`Households/${householdId}`);
    const householdSnap = await transaction.get(householdRef);
    if (!householdSnap.exists) throw notFound;
    const household = householdSnap.data();
    // An invite dies with the member who made it, even if revoking it failed.
    if (!(household.memberIds || []).includes(invite.createdBy)) throw notFound;
    const plantsRef = householdRef.collection("Plants");
    const plants = plantsOf(await transaction.get(plantsRef));

    const userRef = db.doc(`Users/${uid}`);
    const userSnap = await transaction.get(userRef);
    const profile = userSnap.exists ? userSnap.data() : {};
    const oldId = profile.householdId || uid;
    const oldRef = db.doc(`Households/${oldId}`);
    const oldSnap = await transaction.get(oldRef);
    const old = oldSnap.exists && oldId !== householdId ? oldSnap.data() : null;
    const oldPlants = old ? plantsOf(await transaction.get(oldRef.collection("Plants"))) : [];

    const memberIds = household.memberIds || [];
    if (memberIds.includes(uid)) {
      throw new HttpsError("already-exists", "You're already in this household.");
    }
    if (old && (old.memberIds || []).some((id) => id !== uid)) {
      throw new HttpsError("failed-precondition", "Leave your current household first.");
    }
    if (memberIds.length >= MAX_MEMBERS) {
      throw new HttpsError("resource-exhausted", "This household is full.");
    }

    if (preview) {
      return {
        householdName: household.name,
        memberCount: memberIds.length,
        plantsMoving: oldPlants.length,
      };
    }

    const name = displayNameFor({
      displayName: profile.displayName || (authToken && authToken.name),
      email: authToken && authToken.email,
    });
    const writes = linkWrites({ householdId, household, plants, uid, name });
    transaction.update(householdRef, writes.household);
    writes.plantUpdates.forEach(({ id, update }) =>
      transaction.update(plantsRef.doc(id), update),
    );
    transaction.set(userRef, writes.user, { merge: true });

    // Their plants come with them, as personal plants. Their old (solo)
    // household is no longer needed.
    moveWrites({ plants: oldPlants, uid }).forEach(({ id, data: plant }) => {
      transaction.create(plantsRef.doc(id), plant);
      transaction.delete(oldRef.collection("Plants").doc(id));
    });
    if (old) {
      transaction.delete(oldRef);
    }

    return { householdId, householdName: household.name };
  });
}

/**
 * Takes `targetUid` out of the caller's household and gives them a household
 * of their own again, with no plants. Shared by leaving (target is the
 * caller) and removing a member (the caller must have set the household up).
 *
 * The new household is `Households/{targetUid}` when that's free. It isn't
 * free when they set up the household they're leaving (its ID is their uid),
 * so then it gets a new random ID.
 */
async function removeFromHousehold({ db, callerUid, targetUid, now }) {
  const result = await moveOut({ db, callerUid, targetUid, now });
  // Their invite codes stop working. The removal has already happened, so a
  // failure here is logged, not raised; join also checks the creator is still
  // a member.
  try {
    await revokeInvitesBy(db, targetUid);
  } catch (error) {
    logFor("households").error("Couldn't revoke invites", {
      uid: targetUid,
      message: error && error.message,
    });
  }
  return result;
}

async function moveOut({ db, callerUid, targetUid, now }) {
  return db.runTransaction(async (transaction) => {
    const callerRef = db.doc(`Users/${callerUid}`);
    const callerSnap = await transaction.get(callerRef);
    const householdId = (callerSnap.exists && callerSnap.get("householdId")) || callerUid;
    const householdRef = db.doc(`Households/${householdId}`);
    const householdSnap = await transaction.get(householdRef);
    const household = householdSnap.exists ? householdSnap.data() : null;
    const memberIds = (household && household.memberIds) || [];

    if (!household || !memberIds.includes(callerUid)) {
      throw new HttpsError("permission-denied", "You're not in this household.");
    }
    const leaving = targetUid === callerUid;
    if (!leaving && household.createdBy !== callerUid) {
      throw new HttpsError(
        "permission-denied",
        "Only the person who set up the household can remove people.",
      );
    }
    if (!leaving && !memberIds.includes(targetUid)) {
      throw new HttpsError("not-found", "They're not in this household any more.");
    }
    if (memberIds.length < 2) {
      throw new HttpsError("failed-precondition", "You're the only one in this household.");
    }

    const plantsRef = householdRef.collection("Plants");
    const plants = plantsOf(await transaction.get(plantsRef));
    const targetRef = db.doc(`Users/${targetUid}`);
    const targetSnap = leaving ? callerSnap : await transaction.get(targetRef);
    const profile = targetSnap.exists ? targetSnap.data() : {};
    const soloRef = db.doc(`Households/${targetUid}`);
    const soloTaken =
      householdId === targetUid || (await transaction.get(soloRef)).exists;
    const newRef = soloTaken ? db.collection("Households").doc() : soloRef;

    const writes = unlinkWrites({ household, plants, uid: targetUid });
    transaction.update(householdRef, writes.household);
    writes.plantUpdates.forEach(({ id, update }) =>
      transaction.update(plantsRef.doc(id), update),
    );

    // Their profile should point here. If it somehow points elsewhere, they
    // already have another household, so leave it alone.
    if ((profile.householdId || targetUid) !== householdId) {
      return { householdId: profile.householdId };
    }
    const name = displayNameFor({
      displayName:
        profile.displayName ||
        (household.members && household.members[targetUid] && household.members[targetUid].displayName),
    });
    transaction.create(newRef, {
      name: `${name}'s home`,
      memberIds: [targetUid],
      members: { [targetUid]: { displayName: name } },
      createdBy: targetUid,
      createdAt: admin.Timestamp.fromMillis(now),
      timeZone: profile.timeZone || household.timeZone || "UTC",
    });
    transaction.set(targetRef, { householdId: newRef.id }, { merge: true });
    return { householdId: newRef.id };
  });
}

/** The caller leaves their household for one of their own. */
async function leaveHouseholdHandler({ db, uid, now }) {
  return removeFromHousehold({ db, callerUid: uid, targetUid: uid, now });
}

/** The household's creator takes `data.uid` out of it. */
async function removeMemberHandler({ db, uid, data, now }) {
  const targetUid = data && data.uid;
  if (typeof targetUid !== "string" || !targetUid || targetUid.length > 128) {
    throw new HttpsError("invalid-argument", "Say who to remove.");
  }
  if (targetUid === uid) {
    throw new HttpsError("invalid-argument", "Use Leave household to leave.");
  }
  return removeFromHousehold({ db, callerUid: uid, targetUid, now });
}

/** The names a household could have been auto-named from, as "<name>'s home". */
function autoNameCandidates(...names) {
  const found = new Set();
  for (const raw of names) {
    const name = typeof raw === "string" ? raw.trim() : "";
    if (!name) continue;
    found.add(name);
    // The app names a household after the email's local part when there's no
    // display name yet (setupHousehold.ts displayNameFor).
    if (name.includes("@")) found.add(name.split("@")[0]);
  }
  return [...found].map((name) => `${name}'s home`);
}

/**
 * Changes the caller's display name everywhere it is shown: their profile and
 * their entry in the household's member list (which the rules don't let them
 * write themselves for a housemate to see). If the household still has its
 * automatic name ("<old name>'s home", or the one built from their email) and
 * they set it up, it follows the new name.
 *
 * `data.displayName` is checked here too (trimmed, 1 to 50 characters; the
 * wrapper in index.js does the same). Without a household yet (sign-up can
 * race household setup) only the profile is updated and householdName is null.
 */
async function updateDisplayNameHandler({ db, uid, authToken, data }) {
  const displayName = data && data.displayName;
  if (typeof displayName !== "string" || !displayName.trim()) {
    throw new HttpsError("invalid-argument", "displayName must be text of 1 to 50 characters.");
  }
  const newName = displayName.trim();
  if (newName.length > 50) {
    throw new HttpsError("invalid-argument", "displayName must be text of 1 to 50 characters.");
  }

  return db.runTransaction(async (transaction) => {
    const userRef = db.doc(`Users/${uid}`);
    const userSnap = await transaction.get(userRef);
    const profile = userSnap.exists ? userSnap.data() : {};
    const householdId = profile.householdId || uid;
    const householdRef = db.doc(`Households/${householdId}`);
    const householdSnap = await transaction.get(householdRef);
    const household = householdSnap.exists ? householdSnap.data() : null;
    const isMember = Boolean(household) && (household.memberIds || []).includes(uid);

    transaction.set(userRef, { displayName: newName }, { merge: true });
    if (!isMember) return { displayName: newName, householdName: null };

    const members = household.members || {};
    const oldMember = members[uid] || {};
    const update = {
      members: { ...members, [uid]: { ...oldMember, displayName: newName } },
    };
    let householdName = household.name;
    const autoNames = autoNameCandidates(
      profile.displayName,
      oldMember.displayName,
      authToken && authToken.email,
    );
    if (household.createdBy === uid && autoNames.includes(household.name)) {
      householdName = `${newName}'s home`;
      update.name = householdName;
    }
    transaction.update(householdRef, update);
    return { displayName: newName, householdName };
  });
}

module.exports = {
  MAX_MEMBERS,
  revokeInvitesBy,
  updateDisplayNameHandler,
  createInviteHandler,
  joinHouseholdHandler,
  leaveHouseholdHandler,
  removeMemberHandler,
};
