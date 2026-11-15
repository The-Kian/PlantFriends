/**
 * searchPlants — HTTPS callable Cloud Function that proxies plant searches to
 * the Trefle API. The Trefle token lives only on the server (never bundled
 * into the client), so it is not exposed to end users.
 *
 * Expected payload: { q: string }
 * Returns: IPlant[] mapped to the app's shape (mirrors mapTreflePlantToIPlant).
 */
const functions = require("firebase-functions/v1");
const admin = require("./admin");

const { anonymiseUserPlant } = require("./anonymise");
const {
  MAX_INSTANCES,
  requireCaller,
  rateLimit,
  requireString,
  redact,
} = require("./guards");
const { unlinkWrites } = require("./householdAdmin");
const { logFor } = require("./log");
const {
  createInviteHandler,
  joinHouseholdHandler,
  leaveHouseholdHandler,
  removeMemberHandler,
} = require("./households");

admin.initializeApp();

const TREFLE_BASE_URL = "https://trefle.io/api/v1";

// Replicates the client-side `mapTreflePlantToIPlant` mapping so the client
// receives IPlant objects directly.
function mapTreflePlantToIPlant(plant) {
  let wateringFrequency = 0;
  if (plant.watering) {
    const dayMatch = plant.watering.match(/\d+/);
    if (dayMatch) {
      wateringFrequency = parseInt(dayMatch[0], 10);
    } else if (plant.watering.toLowerCase().includes("daily")) {
      wateringFrequency = 1;
    } else if (plant.watering.toLowerCase().includes("weekly")) {
      wateringFrequency = 7;
    } else if (plant.watering.toLowerCase().includes("monthly")) {
      wateringFrequency = 30;
    }
  }

  let tempMin = 0;
  let tempMax = 0;
  if (plant.temperature_minimum && plant.temperature_minimum.deg_c) {
    tempMin = plant.temperature_minimum.deg_c;
  }
  if (plant.temperature_maximum && plant.temperature_maximum.deg_c) {
    tempMax = plant.temperature_maximum.deg_c;
  }

  let matureSize = "";
  if (plant.average_height_value && plant.average_height_unit) {
    matureSize = `~${plant.average_height_value}${plant.average_height_unit}`;
  } else if (plant.maximum_height && plant.maximum_height.cm) {
    matureSize = `Up to ${plant.maximum_height.cm}cm`;
  }

  const descriptionParts = [];
  if (plant.growth_habit)
    descriptionParts.push(`Growth: ${plant.growth_habit}`);
  if (plant.edibility) descriptionParts.push(`Edible: ${plant.edibility}`);
  if (plant.invasive) descriptionParts.push("⚠️ Invasive species");
  const description = descriptionParts.join(" | ");

  const images = [];
  if (plant.image_url) images.push(plant.image_url);
  if (plant.images && Array.isArray(plant.images)) {
    plant.images.forEach((img) => {
      if (img.url) images.push(img.url);
    });
  }

  return {
    id: String(plant.id),
    name: plant.common_name || plant.scientific_name || "Unknown Plant",
    slug: plant.slug || "",
    scientific_name: [plant.scientific_name],
    common_names: plant.synonyms || [],
    description: description || `A ${plant.family} species`,
    sun_requirements: plant.light || "",
    watering_frequency: wateringFrequency,
    fertilizer_needs: plant.soil || "",
    temperature_minimum: tempMin,
    temperature_maximum: tempMax,
    humidity_requirements: "",
    growth_rate: plant.growth_rate || "",
    pruning_needs: "",
    pest_susceptibility: [],
    toxicity: plant.restrictions || "",
    images: images.filter(Boolean),
    mature_size: matureSize,
    contributedBy: "Trefle API",
    isVerified: plant.status === "accepted",
  };
}

// Declaring the secret makes Firebase inject it into process.env at runtime.
// Set it with `firebase functions:secrets:set TREFLE_API_KEY`.
exports.searchPlants = functions
  .runWith({ secrets: ["TREFLE_API_KEY"], maxInstances: MAX_INSTANCES })
  .https.onCall(async (data, context) => {
    const log = logFor("searchPlants");
    const uid = requireCaller(context);
    const q = requireString(data && data.q, "q", 100);
    await rateLimit(uid, "searchPlants", 30, 60 * 1000);

    const TREFLE_API_KEY = process.env.TREFLE_API_KEY;
    if (!TREFLE_API_KEY) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Trefle API key is not configured."
      );
    }

    try {
      const url = `${TREFLE_BASE_URL}/species/search?token=${encodeURIComponent(
        TREFLE_API_KEY
      )}&q=${encodeURIComponent(q)}&limit=20`;
      const response = await fetch(url);

      if (response.status === 401) {
        throw new functions.https.HttpsError(
          "internal",
          "Invalid Trefle API token."
        );
      }
      if (response.status === 429) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Trefle API rate limit reached."
        );
      }
      if (!response.ok) {
        throw new functions.https.HttpsError(
          "internal",
          `Trefle API request failed with status ${response.status}.`
        );
      }

      const payload = await response.json();
      const dataList =
        payload && Array.isArray(payload.data) ? payload.data : [];
      // The count only: what someone searched for is their own business.
      log.info("searchPlants finished", { uid, results: dataList.length });
      return { plants: dataList.map(mapTreflePlantToIPlant) };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        log.warn("searchPlants refused", { uid, code: error.code });
        throw error;
      }
      // The request URL holds the Trefle token, so never log the raw error.
      log.error("searchPlants failed", {
        uid,
        message: redact(error && error.message, [TREFLE_API_KEY]),
      });
      throw new functions.https.HttpsError("internal", "Search failed.");
    }
  });

/**
 * deleteAccount — HTTPS callable that deletes the calling user's account.
 *
 * 1. Copies an anonymised version of each of their plants into the
 *    `AnonymousPlants` collection (not readable by clients).
 * 2. Deletes their household with its plants if they are its only member.
 *    In a shared household it deletes only the plants they added and takes
 *    them off the members and carers, as leaving does (unlinkWrites), so
 *    housemates keep their own plants and none is left without a carer.
 * 3. Deletes `Users/{uid}` and everything under it.
 * 4. Deletes the Firebase Auth user.
 *
 * Runs with the Admin SDK, so it does not need a recent login. Safe to call
 * again if a previous attempt failed part way.
 */
exports.deleteAccount = functions
  .runWith({ maxInstances: MAX_INSTANCES })
  .https.onCall(async (data, context) => {
    // Takes no input; anything sent is ignored.
    const log = logFor("deleteAccount");
    const uid = requireCaller(context);
    const db = admin.db();
    const userRef = db.collection("Users").doc(uid);

    try {
      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data() : {};
      const householdRef = db
        .collection("Households")
        .doc(userData.householdId || uid);
      const householdSnap = await householdRef.get();
      const memberIds = householdSnap.exists
        ? householdSnap.data().memberIds || []
        : [];
      const isMember = memberIds.includes(uid);
      const hasHousemates = memberIds.some((id) => id !== uid);

      // Their plants: the ones they added to the household, plus any left in
      // the old UserPlants collection if they never ran the migration (once
      // migrated, those are copies of household plants and would count twice).
      const householdPlants = isMember
        ? (await householdRef.collection("Plants").get()).docs.filter(
            (plantDoc) => plantDoc.data().addedBy === uid
          )
        : [];
      const oldPlants = userData.plantsMigratedAt
        ? []
        : (await userRef.collection("UserPlants").get()).docs;

      const writer = db.bulkWriter();
      [...householdPlants, ...oldPlants].forEach((plantDoc) => {
        writer.create(db.collection("AnonymousPlants").doc(), {
          ...anonymiseUserPlant(plantDoc.data()),
          anonymisedAt: admin.FieldValue.serverTimestamp(),
        });
      });
      await writer.close();

      if (isMember && hasHousemates) {
        const others = (await householdRef.collection("Plants").get()).docs
          .filter((plantDoc) => plantDoc.data().addedBy !== uid)
          .map((plantDoc) => ({ id: plantDoc.id, data: plantDoc.data() }));
        const writes = unlinkWrites({
          household: householdSnap.data(),
          plants: others,
          uid,
        });
        const cleanup = db.bulkWriter();
        householdPlants.forEach((plantDoc) => cleanup.delete(plantDoc.ref));
        cleanup.update(householdRef, writes.household);
        writes.plantUpdates.forEach(({ id, update }) =>
          cleanup.update(householdRef.collection("Plants").doc(id), update)
        );
        await cleanup.close();
      } else if (isMember) {
        await db.recursiveDelete(householdRef);
      }

      await db.recursiveDelete(userRef);

      try {
        await admin.auth().deleteUser(uid);
      } catch (error) {
        if (error.code !== "auth/user-not-found") {
          throw error;
        }
      }

      log.info("deleteAccount finished", {
        uid,
        householdId: householdRef.id,
        plantsAnonymised: householdPlants.length + oldPlants.length,
        housematesLeft: hasHousemates ? memberIds.length - 1 : 0,
      });
      return { deleted: true };
    } catch (error) {
      log.error("deleteAccount failed", {
        uid,
        message: error && error.message,
        code: error && error.code,
      });
      throw new functions.https.HttpsError(
        "internal",
        "Account deletion failed. Please try again."
      );
    }
  });

/**
 * The parts of a household call's result that are safe and useful to log:
 * IDs and counts. Never the invite code or the household's name.
 */
function logFields(result) {
  const fields = {};
  for (const key of ["householdId", "memberCount", "plantsMoving"]) {
    if (result && result[key] !== undefined) fields[key] = result[key];
  }
  return fields;
}

/**
 * Runs an invite/join handler for the signed-in caller. HttpsErrors go to the
 * app as they are; anything else is logged (ids only, never codes, emails or
 * names) and the app gets a generic error.
 */
async function runHouseholdCall(name, context, limit, run) {
  requireCaller(context);
  const { uid, token } = context.auth;
  // Limits code guessing: previews and joins share one per-user allowance.
  await rateLimit(uid, name, limit.max, limit.windowMs);
  const log = logFor(name);
  try {
    const result = await run({
      db: admin.db(),
      uid,
      authToken: token,
      now: Date.now(),
    });
    log.info(`${name} finished`, { uid, ...logFields(result) });
    return result;
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      // An expected refusal (wrong code, full household): the code is enough.
      log.warn(`${name} refused`, { uid, code: error.code });
      throw error;
    }
    log.error(`${name} failed`, {
      uid,
      message: error && error.message,
    });
    throw new functions.https.HttpsError(
      "internal",
      "Something went wrong. Please try again."
    );
  }
}

/** createInvite — a member gets a code to share. See ./households.js. */
exports.createInvite = functions
  .runWith({ maxInstances: MAX_INSTANCES })
  .https.onCall((data, context) =>
    runHouseholdCall(
      "createInvite",
      context,
      { max: 20, windowMs: 60 * 60 * 1000 },
      (args) => createInviteHandler(args)
    )
  );

/** joinHousehold — join with a code, or preview it with { preview: true }. */
exports.joinHousehold = functions
  .runWith({ maxInstances: MAX_INSTANCES })
  .https.onCall((data, context) => {
    requireCaller(context);
    const code = requireString(data && data.code, "code", 32);
    return runHouseholdCall(
      "joinHousehold",
      context,
      { max: 20, windowMs: 60 * 60 * 1000 },
      (args) => joinHouseholdHandler({ ...args, data: { ...data, code } })
    );
  });

/** leaveHousehold — the caller goes back to a household of their own. */
exports.leaveHousehold = functions
  .runWith({ maxInstances: MAX_INSTANCES })
  .https.onCall((data, context) =>
    runHouseholdCall(
      "leaveHousehold",
      context,
      { max: 10, windowMs: 60 * 60 * 1000 },
      (args) => leaveHouseholdHandler(args)
    )
  );

/** removeMember({ uid }) — the household's creator removes a member. */
exports.removeMember = functions
  .runWith({ maxInstances: MAX_INSTANCES })
  .https.onCall((data, context) => {
    requireCaller(context);
    const targetUid = requireString(data && data.uid, "uid", 128);
    return runHouseholdCall(
      "removeMember",
      context,
      { max: 20, windowMs: 60 * 60 * 1000 },
      (args) => removeMemberHandler({ ...args, data: { uid: targetUid } })
    );
  });

// Shared-care notifications: see ./notifications.js.
exports.onPlantWritten = require("./notifications").onPlantWritten;

// Watering reminders, every 15 minutes: see ./reminders.js.
exports.sendWateringReminders = require("./reminders").sendWateringReminders;
