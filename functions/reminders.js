/**
 * Watering reminders, sent from the server so they know when a housemate has
 * already watered. See "Time to water and Still thirsty" in
 * docs/household-sharing-plan.md.
 *
 * 1. Planning: when a plant's `next_watering_date` or `reminders_enabled`
 *    changes, onPlantWritten (./notifications.js) calls planReminder, which
 *    sets `notify_at` (the due time moved out of quiet hours) and
 *    `notify_stage: "due"`, or clears both.
 * 2. Sending: sendWateringReminders runs every 15 minutes and finds plants
 *    whose `notify_at` has passed. A "due" plant gets a push to every carer
 *    and moves to "nudge" a day later; a "nudge" plant gets one follow-up and
 *    then both fields are cleared, so nobody is nagged.
 *
 * notify_at and notify_stage are only ever written here (firestore.rules
 * stops the app changing them).
 */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const { MAX_INSTANCES } = require("./guards");
const { basePlantName, householdTimeZone } = require("./lookups");
const { DAY_MS, notifyAt } = require("./notifyAt");
const { plantName, reminderMessage } = require("./plantMessages");
const { sendToUsers } = require("./push");

const CLEAR = Object.freeze({ notify_at: null, notify_stage: null });
// Plants handled per run. Anything left over is picked up 15 minutes later.
const BATCH_LIMIT = 500;

/** True when a write changes what the plant's reminder should be. */
function needsPlan(before, after) {
  if (!after) return false;
  if (!before) return true;
  return (
    before.next_watering_date !== after.next_watering_date ||
    before.reminders_enabled !== after.reminders_enabled
  );
}

/** The `notify_at` and `notify_stage` a plant should have now. */
function reminderPlan(plant, now, timeZone) {
  const due = plant.next_watering_date;
  if (
    plant.reminders_enabled === false ||
    typeof due !== "number" ||
    !(due > 0)
  ) {
    return { ...CLEAR };
  }
  // An overdue plant is reminded about at the next sensible time.
  return {
    notify_at: notifyAt(Math.max(due, now), timeZone),
    notify_stage: "due",
  };
}

const samePlan = (plant, plan) =>
  (plant.notify_at ?? null) === plan.notify_at &&
  (plant.notify_stage ?? null) === plan.notify_stage;

/**
 * Plans the reminder for one write. It reads the plant again in a transaction
 * and plans from what's there now, so two writes close together can't leave a
 * stale plan whichever trigger runs last. Its own write only touches
 * notify_at and notify_stage, so needsPlan is false for it: no loop.
 *
 * @returns the plan written, or null if nothing changed.
 */
async function planReminder({ db, ref, householdId, before, after, now }) {
  if (!needsPlan(before, after)) return null;
  const timeZone = await householdTimeZone(db, householdId);
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return null;
    const plant = snap.data();
    const plan = reminderPlan(plant, now, timeZone);
    if (samePlan(plant, plan)) return null;
    transaction.update(ref, plan);
    return plan;
  });
}

/**
 * What to do with a plant whose `notify_at` has passed: the fields to write
 * and which push to send (or null for none).
 */
function nextStep(plant, now, timeZone) {
  if (plant.reminders_enabled === false) {
    return { update: { ...CLEAR }, send: null };
  }
  if (plant.notify_stage === "due") {
    // A day after the reminder went out, or a day from now if this run is
    // very late, so the nudge never follows straight on.
    let base = plant.notify_at + DAY_MS;
    if (!(base > now)) base = now + DAY_MS;
    return {
      update: { notify_at: notifyAt(base, timeZone), notify_stage: "nudge" },
      send: "due",
    };
  }
  if (plant.notify_stage === "nudge") {
    return { update: { ...CLEAR }, send: "nudge" };
  }
  return { update: { ...CLEAR }, send: null };
}

/** Who gets a plant's reminders: its carers, or whoever added it. */
function recipientsFor(plant) {
  const carers = (plant.carerIds || []).filter(Boolean);
  if (carers.length > 0) return carers;
  return plant.addedBy ? [plant.addedBy] : [];
}

// Firestore's FAILED_PRECONDITION and NOT_FOUND, as the Admin SDK reports them.
const isLostRace = (error) =>
  Boolean(error) &&
  [9, 5, "failed-precondition", "not-found"].includes(error.code);

/** The household a plant document belongs to, or null for catalog plants. */
function householdIdOf(ref) {
  const household = ref.parent && ref.parent.parent;
  if (!household || !household.parent || household.parent.id !== "Households")
    return null;
  return household.id;
}

/**
 * One run of sendWateringReminders. Each plant is claimed first, by writing
 * its next stage with a `lastUpdateTime` precondition, and the push goes out
 * only once the claim succeeds. So if someone waters the plant (or another
 * run gets there first) between the query and the write, the fresh plan is
 * kept and no stale reminder is sent.
 *
 * @returns counts for the log line.
 */
async function sendDueReminders({
  db,
  now,
  send = sendToUsers,
  limit = BATCH_LIMIT,
}) {
  const snap = await db
    .collectionGroup("Plants")
    .where("notify_at", "<=", now)
    .limit(limit)
    .get();

  const summary = {
    found: snap.docs.length,
    due: 0,
    nudge: 0,
    cleared: 0,
    skipped: 0,
    failed: 0,
    devices: 0,
  };
  const zones = new Map();
  const zoneFor = (householdId) => {
    if (!zones.has(householdId))
      zones.set(householdId, householdTimeZone(db, householdId));
    return zones.get(householdId);
  };

  for (const doc of snap.docs) {
    const householdId = householdIdOf(doc.ref);
    if (!householdId) {
      // A catalog plant (/Plants) the app was able to give a notify_at. Clear
      // it, or it would come back every run and could fill the batch.
      summary.skipped++;
      await doc.ref.update({ ...CLEAR }).catch(() => {});
      continue;
    }
    const plant = doc.data();
    try {
      const step = nextStep(plant, now, await zoneFor(householdId));
      try {
        await doc.ref.update(step.update, { lastUpdateTime: doc.updateTime });
      } catch (error) {
        if (!isLostRace(error)) throw error;
        summary.skipped++;
        continue;
      }
      if (!step.send) {
        summary.cleared++;
        continue;
      }
      const name = plantName(plant, await basePlantName(db, plant));
      const message = reminderMessage({
        plant,
        plantId: doc.id,
        householdId,
        name,
        stage: step.send,
      });
      summary.devices += await send(
        db,
        recipientsFor(plant),
        message,
        "reminders"
      );
      summary[step.send]++;
    } catch (error) {
      summary.failed++;
      functions.logger.error("Reminder failed", {
        householdId,
        plantId: doc.id,
        message: error && error.message,
      });
    }
  }
  return summary;
}

const sendWateringReminders = functions
  .runWith({ timeoutSeconds: 300, maxInstances: MAX_INSTANCES })
  .pubsub.schedule("every 15 minutes")
  .onRun(async () => {
    const summary = await sendDueReminders({
      db: admin.firestore(),
      now: Date.now(),
    });
    functions.logger.info("sendWateringReminders finished", summary);
    if (summary.found === BATCH_LIMIT) {
      functions.logger.warn(
        "sendWateringReminders hit its batch limit; the rest wait for the next run"
      );
    }
  });

module.exports = {
  BATCH_LIMIT,
  needsPlan,
  reminderPlan,
  planReminder,
  nextStep,
  recipientsFor,
  sendDueReminders,
  sendWateringReminders,
};
