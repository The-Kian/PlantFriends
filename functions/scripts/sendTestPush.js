/**
 * Sends a test push to every phone an account has registered, to check
 * notifications work end to end. Run by the "Send test push" GitHub workflow.
 *
 * Env: FIREBASE_SERVICE_ACCOUNT (the service account key JSON), EMAIL (the
 * account to notify), PLANT_ID (optional: the plant the push opens; defaults
 * to one of the account's household plants).
 */
const { cert } = require("firebase-admin/app");
const admin = require("../admin");

const { EXPO_PUSH_URL } = require("../push");

const RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

async function main() {
  const { FIREBASE_SERVICE_ACCOUNT, EMAIL, PLANT_ID } = process.env;
  if (!FIREBASE_SERVICE_ACCOUNT) fail("The FIREBASE_SERVICE_ACCOUNT secret isn't set.");
  const email = (EMAIL || "").trim().toLowerCase();
  if (!email) fail("An email is needed.");

  const credentials = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: cert(credentials),
    projectId: credentials.project_id,
  });
  const db = admin.db();

  const user = await admin.auth().getUserByEmail(email).catch(() => fail(`No PlantFriends account uses ${email}.`));
  const devices = (await db.collection(`Users/${user.uid}/Devices`).get()).docs;
  console.log(`${email} has ${devices.length} registered phone(s).`);
  if (devices.length === 0) {
    fail("No phones registered. In the app, water or add a plant and allow notifications, then run this again.");
  }

  let plantId = (PLANT_ID || "").trim();
  let plantName = "your plant";
  const householdId = (await db.doc(`Users/${user.uid}`).get()).get("householdId");
  if (householdId) {
    const plants = await db.collection(`Households/${householdId}/Plants`).limit(20).get();
    const plant = plants.docs.find((d) => d.id === plantId) || plants.docs[0];
    if (plant) {
      plantId = plant.id;
      plantName = plant.get("custom_name") || plantName;
    }
  }

  const messages = devices.map((d) => ({
    to: d.get("expoPushToken"),
    sound: "default",
    title: "PlantFriends test 🌱",
    body: `Tap to open ${plantName}.`,
    data: plantId ? { plantId, householdId, type: "test" } : { type: "test" },
  }));
  const sent = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  const { data: tickets = [], errors } = await sent.json();
  if (errors) fail(`Expo refused the request: ${JSON.stringify(errors)}`);

  let problems = 0;
  tickets.forEach((t, i) => {
    const phone = `${devices[i].get("platform") || "phone"} ${i + 1}`;
    if (t.status === "ok") console.log(`${phone}: accepted by Expo.`);
    else {
      problems += 1;
      console.log(`${phone}: refused by Expo: ${t.message} (${(t.details && t.details.error) || "no code"})`);
    }
  });

  // Expo hands the push to Firebase (Android) or Apple (iOS) shortly after.
  // Receipts say whether that worked, e.g. whether the FCM key is set up.
  const ids = tickets.filter((t) => t.status === "ok").map((t) => t.id);
  if (ids.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 15000));
    const receiptsRes = await fetch(RECEIPTS_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const { data: receipts = {} } = await receiptsRes.json();
    ids.forEach((id, i) => {
      const r = receipts[id];
      if (!r) console.log(`Push ${i + 1}: no delivery receipt yet (that's usually fine).`);
      else if (r.status === "ok") console.log(`Push ${i + 1}: delivered to Firebase/Apple.`);
      else {
        problems += 1;
        console.log(`Push ${i + 1}: delivery failed: ${r.message} (${(r.details && r.details.error) || "no code"})`);
      }
    });
  }

  if (problems > 0) fail(`${problems} problem(s) sending the test push. See above.`);
  console.log(plantId ? `Done. Tapping it should open plant ${plantId}.` : "Done.");
}

main().catch((error) => fail(error.message));
