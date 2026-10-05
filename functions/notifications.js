/**
 * Shared-care notifications.
 *
 * onPlantWritten — when someone waters a plant, tells its other carers it's
 *   done. On any change to the due date, plans the plant's next reminder
 *   (`notify_at` / `notify_stage`).
 * sendWateringReminders — every 15 minutes, sends the reminders and nudges
 *   whose `notify_at` has come.
 *
 * See docs/household-sharing-plan.md.
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { sendToUsers } = require("./push");
const {
  plantName,
  isWatering,
  wateredMessages,
  reminderMessage,
  planAfterWrite,
  planAfterSend,
} = require("./plantMessages");

const REMINDER_BATCH_LIMIT = 500;

async function householdTimeZone(db, householdId, cache) {
  if (cache && cache.has(householdId)) return cache.get(householdId);
  const snap = await db.doc(`Households/${householdId}`).get();
  const timeZone = (snap.exists && snap.get("timeZone")) || "UTC";
  if (cache) cache.set(householdId, timeZone);
  return timeZone;
}

async function basePlantName(db, plant) {
  if (!plant.plantId) return null;
  try {
    const snap = await db.doc(`Plants/${plant.plantId}`).get();
    return snap.exists ? snap.get("name") || null : null;
  } catch {
    return null;
  }
}

exports.onPlantWritten = functions.firestore
  .document("Households/{householdId}/Plants/{plantId}")
  .onWrite(async (change, context) => {
    const { householdId, plantId } = context.params;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return; // deleted

    const db = admin.firestore();
    const now = Date.now();
    const timeZone = await householdTimeZone(db, householdId);

    // Plan the next reminder first, so a failed push can't leave it unplanned.
    // This write fires the trigger again; that run changes nothing and stops.
    const plan = planAfterWrite(before, after, now, timeZone);
    if (plan) {
      await change.after.ref.update(plan);
    }

    if (isWatering(before, after)) {
      const name = plantName(after, await basePlantName(db, after));
      const messages = wateredMessages({
        plant: after,
        plantId,
        householdId,
        name,
        now,
        timeZone,
      });
      for (const { uids, message } of messages) {
        await sendToUsers(db, uids, message, "housemateActivity");
      }
    }
  });

exports.sendWateringReminders = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    const db = admin.firestore();
    const now = Date.now();
    const timeZones = new Map();

    // Only household plants have notify_at, so the /Plants catalog never matches.
    const due = await db
      .collectionGroup("Plants")
      .where("notify_at", "<=", now)
      .limit(REMINDER_BATCH_LIMIT)
      .get();

    for (const snap of due.docs) {
      const householdId = snap.ref.parent.parent && snap.ref.parent.parent.id;
      if (!householdId) continue;
      const plant = snap.data();

      try {
        const timeZone = await householdTimeZone(db, householdId, timeZones);
        const name = plantName(plant, await basePlantName(db, plant));
        await sendToUsers(
          db,
          plant.carerIds || [],
          reminderMessage({ plant, plantId: snap.id, householdId, name }),
          "reminders",
        );

        // If someone watered it while this ran, keep the fresh plan they made.
        await snap.ref.update(planAfterSend(plant, now, timeZone), {
          lastUpdateTime: snap.updateTime,
        });
      } catch (error) {
        if (error.code === 9 /* FAILED_PRECONDITION */) continue;
        functions.logger.error("sendWateringReminders failed for a plant", {
          path: snap.ref.path,
          error,
        });
      }
    }
  });
