/**
 * Invites and joining a household. The handlers take plain arguments (a
 * Firestore, the caller's uid and so on) so they can be tested with a fake db;
 * the callable wrappers in index.js pass the real ones.
 *
 * Invites/{code} is written and read only here (see firestore.rules).
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { generateCode, normaliseCode } = require("./inviteCode");
const {
  displayNameFor,
  linkWrites,
  moveWrites,
  unlinkWrites,
  createdByUpdate,
} = require("./householdAdmin");

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

  const expiresAt = admin.firestore.Timestamp.fromMillis(now + INVITE_LIFETIME_MS);
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const code = generateCode();
    try {
      // create() fails if the code exists, so an old invite is never overwritten.
      await db.doc(`Invites/${code}`).create({
        householdId,
        createdBy: uid,
        createdAt: admin.firestore.Timestamp.fromMillis(now),
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
 * Takes `target` out of the caller's household, in one transaction. Their own
 * plants stay with whoever is left, their householdId is cleared (the app
 * then sets them up a household of their own), and if they made the household
 * it passes to the longest-standing member.
 */
async function removeFromHousehold({ db, householdId, target, isAllowed }) {
  return db.runTransaction(async (transaction) => {
    const householdRef = db.doc(`Households/${householdId}`);
    const householdSnap = await transaction.get(householdRef);
    const household = householdSnap.exists ? householdSnap.data() : null;
    const memberIds = (household && household.memberIds) || [];
    isAllowed(household, memberIds);
    if (!memberIds.includes(target)) {
      throw new HttpsError("not-found", "That person isn't in this household.");
    }
    if (memberIds.length < 2) {
      throw new HttpsError("failed-precondition", "You're the only member of this household.");
    }
    const plantsRef = householdRef.collection("Plants");
    const plants = plantsOf(await transaction.get(plantsRef));

    const writes = unlinkWrites({ household, plants, uid: target });
    transaction.update(householdRef, {
      ...writes.household,
      ...createdByUpdate(household, target),
    });
    writes.plantUpdates.forEach(({ id, update }) =>
      transaction.update(plantsRef.doc(id), update),
    );
    transaction.set(
      db.doc(`Users/${target}`),
      { householdId: admin.firestore.FieldValue.delete() },
      { merge: true },
    );
  });
}

async function householdIdOf(db, uid) {
  const userSnap = await db.doc(`Users/${uid}`).get();
  return (userSnap.exists && userSnap.get("householdId")) || uid;
}

/** The caller leaves their household. */
async function leaveHouseholdHandler({ db, uid }) {
  const householdId = await householdIdOf(db, uid);
  await removeFromHousehold({
    db,
    householdId,
    target: uid,
    isAllowed: (household, memberIds) => {
      if (!household || !memberIds.includes(uid)) {
        throw new HttpsError("permission-denied", "You're not in this household.");
      }
    },
  });
  return { left: true };
}

/**
 * The person who made the household takes someone out of it. Naming yourself
 * is the same as leaving.
 */
async function removeMemberHandler({ db, uid, data }) {
  const target = data && typeof data.uid === "string" ? data.uid : "";
  if (!target) {
    throw new HttpsError("invalid-argument", "Say who to remove.");
  }
  const householdId = await householdIdOf(db, uid);
  await removeFromHousehold({
    db,
    householdId,
    target,
    isAllowed: (household, memberIds) => {
      if (!household || !memberIds.includes(uid)) {
        throw new HttpsError("permission-denied", "You're not in this household.");
      }
      if (target !== uid && household.createdBy !== uid) {
        throw new HttpsError(
          "permission-denied",
          "Only the person who made this household can remove people.",
        );
      }
    },
  });
  return { removed: true };
}

module.exports = {
  MAX_MEMBERS,
  createInviteHandler,
  joinHouseholdHandler,
  leaveHouseholdHandler,
  removeMemberHandler,
};
