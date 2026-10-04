/**
 * searchPlants — HTTPS callable Cloud Function that proxies plant searches to
 * the Trefle API. The Trefle token lives only on the server (never bundled
 * into the client), so it is not exposed to end users.
 *
 * Expected payload: { q: string }
 * Returns: IPlant[] mapped to the app's shape (mirrors mapTreflePlantToIPlant).
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { anonymiseUserPlant } = require("./anonymise");

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
  if (plant.growth_habit) descriptionParts.push(`Growth: ${plant.growth_habit}`);
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
  .runWith({ secrets: ["TREFLE_API_KEY"] })
  .https.onCall(async (data, context) => {
    const TREFLE_API_KEY = process.env.TREFLE_API_KEY;
    if (!TREFLE_API_KEY) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Trefle API key is not configured.",
      );
    }

    const q = (data && data.q ? String(data.q).trim() : "").slice(0, 100);
    if (!q) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A non-empty search query is required.",
      );
    }

    try {
      const url = `${TREFLE_BASE_URL}/species/search?token=${encodeURIComponent(
        TREFLE_API_KEY,
      )}&q=${encodeURIComponent(q)}&limit=20`;
      const response = await fetch(url);

      if (response.status === 401) {
        throw new functions.https.HttpsError(
          "internal",
          "Invalid Trefle API token.",
        );
      }
      if (response.status === 429) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Trefle API rate limit reached.",
        );
      }
      if (!response.ok) {
        throw new functions.https.HttpsError(
          "internal",
          `Trefle API request failed with status ${response.status}.`,
        );
      }

      const payload = await response.json();
      const dataList = payload && Array.isArray(payload.data) ? payload.data : [];
      return { plants: dataList.map(mapTreflePlantToIPlant) };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      functions.logger.error("searchPlants failed", error);
      throw new functions.https.HttpsError("internal", "Search failed.");
    }
  });

/**
 * deleteAccount — HTTPS callable that deletes the calling user's account.
 *
 * 1. Copies an anonymised version of each of their plants into the
 *    `AnonymousPlants` collection (not readable by clients).
 * 2. Deletes `Users/{uid}` and everything under it.
 * 3. Deletes the Firebase Auth user.
 *
 * Runs with the Admin SDK, so it does not need a recent login. Safe to call
 * again if a previous attempt failed part way.
 */
exports.deleteAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in to delete your account.",
    );
  }

  const uid = context.auth.uid;
  const db = admin.firestore();
  const userRef = db.collection("Users").doc(uid);

  try {
    const userPlants = await userRef.collection("UserPlants").get();
    const writer = db.bulkWriter();
    userPlants.forEach((plantDoc) => {
      writer.create(
        db.collection("AnonymousPlants").doc(),
        {
          ...anonymiseUserPlant(plantDoc.data()),
          anonymisedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      );
    });
    await writer.close();

    await db.recursiveDelete(userRef);

    try {
      await admin.auth().deleteUser(uid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    return { deleted: true };
  } catch (error) {
    functions.logger.error("deleteAccount failed", { uid, error });
    throw new functions.https.HttpsError(
      "internal",
      "Account deletion failed. Please try again.",
    );
  }
});
