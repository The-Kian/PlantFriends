/**
 * Links a housemate into someone's household, or unlinks them.
 * Run by the "Link housemate" GitHub workflow (.github/workflows/link-housemate.yml).
 *
 * Env: FIREBASE_SERVICE_ACCOUNT (the service account key JSON), ACTION
 * ("link" or "unlink"), OWNER_EMAIL (whose household), HOUSEMATE_EMAIL.
 */
const admin = require("firebase-admin");

const { displayNameFor, linkWrites, unlinkWrites } = require("../householdAdmin");

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

async function main() {
  const { FIREBASE_SERVICE_ACCOUNT, ACTION, OWNER_EMAIL, HOUSEMATE_EMAIL } = process.env;
  if (!FIREBASE_SERVICE_ACCOUNT) {
    fail("The FIREBASE_SERVICE_ACCOUNT secret isn't set. See functions/README.md.");
  }
  const ownerEmail = (OWNER_EMAIL || "").trim().toLowerCase();
  const housemateEmail = (HOUSEMATE_EMAIL || "").trim().toLowerCase();
  if (!ownerEmail || !housemateEmail) fail("Both emails are needed.");
  if (ownerEmail === housemateEmail) fail("The two emails are the same person.");

  const credentials = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    projectId: credentials.project_id,
  });
  const db = admin.firestore();

  const lookUp = (email) =>
    admin.auth().getUserByEmail(email).catch(() => fail(`No PlantFriends account uses ${email}.`));
  const owner = await lookUp(ownerEmail);
  const housemate = await lookUp(housemateEmail);

  const householdId = (await db.doc(`Users/${owner.uid}`).get()).get("householdId");
  if (!householdId) {
    fail(`${ownerEmail} has no household yet. Open the app as them once, then try again.`);
  }
  const householdRef = db.doc(`Households/${householdId}`);
  const householdSnap = await householdRef.get();
  if (!householdSnap.exists) fail(`Household ${householdId} doesn't exist.`);
  const household = householdSnap.data();
  const plants = (await householdRef.collection("Plants").get()).docs.map((d) => ({
    id: d.id,
    data: d.data(),
  }));
  const userRef = db.doc(`Users/${housemate.uid}`);

  if (ACTION === "unlink") {
    const writes = unlinkWrites({ household, plants, uid: housemate.uid });
    if (!writes) return console.log(`${housemateEmail} isn't in "${household.name}". Nothing to do.`);
    const batch = db.batch();
    batch.update(householdRef, writes.household);
    writes.plantUpdates.forEach(({ id, update }) =>
      batch.update(householdRef.collection("Plants").doc(id), update),
    );
    batch.set(userRef, { householdId: admin.firestore.FieldValue.delete() }, { merge: true });
    await batch.commit();
    return console.log(
      `Removed ${housemateEmail} from "${household.name}" (${writes.plantUpdates.length} plants updated). ` +
        "Their app will set up a household of their own.",
    );
  }

  if (ACTION !== "link") fail(`Unknown action "${ACTION}".`);
  const profile = (await userRef.get()).data() || {};
  const writes = linkWrites({
    householdId,
    household,
    plants,
    uid: housemate.uid,
    name: displayNameFor({
      displayName: profile.displayName || housemate.displayName,
      email: housemate.email,
    }),
  });
  if (!writes) return console.log(`${housemateEmail} is already in "${household.name}". Nothing to do.`);
  const batch = db.batch();
  batch.update(householdRef, writes.household);
  writes.plantUpdates.forEach(({ id, update }) =>
    batch.update(householdRef.collection("Plants").doc(id), update),
  );
  batch.set(userRef, writes.user, { merge: true });
  await batch.commit();
  console.log(
    `Added ${housemateEmail} to "${household.name}" (${writes.plantUpdates.length} shared plants updated). ` +
      "Their app switches over within a few seconds.",
  );
}

main().catch((error) => fail(error.message));
