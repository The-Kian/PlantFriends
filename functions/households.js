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

const { HttpsError } = functions.https;

// Firestore's "document already exists" error, as the Admin SDK reports it.
const isAlreadyExists = (error) =>
  Boolean(error) && (error.code === 6 || error.code === "already-exists");

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
      return { code, expiresAt: expiresAt.toMillis(), householdName: household.name };
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
    }
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

module.exports = {
  MAX_MEMBERS,
  createInviteHandler,
  joinHouseholdHandler,
  leaveHouseholdHandler,
  removeMemberHandler,
};
