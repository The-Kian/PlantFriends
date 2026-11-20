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
const admin = require("./admin");

const { MAX_INSTANCES } = require("./guards");
const { basePlantName, householdTimeZone } = require("./lookups");
const { DAY_MS, notifyAt } = require("./notifyAt");
const { plantName, reminderMessage } = require("./plantMessages");
const { checkPushReceipts, sendToUsers } = require("./push");
const { logFor } = require("./log");

const log = logFor("sendWateringReminders");

// Everything the planner owns. `notify_for` is the due date the plan was made
// for; `notify_sending` and `notify_lease` exist only while a push is going out.
const CLEAR = Object.freeze({
  notify_at: null,
  notify_stage: null,
  notify_for: null,
  notify_sending: null,
  notify_lease: null,
});
// The same without `notify_for`, so an update keeps the due date that was
// handled and a duplicate trigger for it can't start the cycle again.
const { notify_for: _handled, ...KEEP_FOR } = CLEAR;
const DONE = Object.freeze(KEEP_FOR);
// A "sending" claim older than this is treated as a send that never finished.
const LEASE_MS = 10 * 60 * 1000;
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
    ...CLEAR,
    notify_at: notifyAt(Math.max(due, now), timeZone),
    notify_stage: "due",
    notify_for: due,
  };
}

const samePlan = (plant, plan) =>
  Object.keys(CLEAR).every((key) => (plant[key] ?? null) === plan[key]);

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
    // Already planned (or already sent) for this due date: a late or repeated
    // trigger must not start the cycle again and send one reminder too many.
    if (plan.notify_for != null && plant.notify_for === plan.notify_for) {
      return null;
    }
    if (samePlan(plant, plan)) return null;
    transaction.update(ref, plan);
    return plan;
  });
}

/**
 * What to do with a plant whose `notify_at` has passed: the fields to write
 * once the push is out, and which push to send (or null for none). A plant
 * left in "sending" by a run that died is treated as still in the stage it
 * was sending.
 */
function nextStep(plant, now, timeZone) {
  if (plant.reminders_enabled === false) {
    return { update: { ...CLEAR }, send: null };
  }
  const stage =
    plant.notify_stage === "sending" ? plant.notify_sending : plant.notify_stage;
  if (stage === "due") {
    // A day after the reminder went out, or a day from now if this run is
    // very late, so the nudge never follows straight on.
    let base = plant.notify_at + DAY_MS;
    if (!(base > now)) base = now + DAY_MS;
    return {
      update: { ...DONE, notify_at: notifyAt(base, timeZone), notify_stage: "nudge" },
      send: "due",
    };
  }
  if (stage === "nudge") {
    return { update: { ...DONE }, send: "nudge" };
  }
  return { update: { ...CLEAR }, send: null };
}

/** True while another run's claim on this plant is recent enough to trust. */
const leaseIsFresh = (plant, now) =>
  plant.notify_stage === "sending" &&
  typeof plant.notify_lease === "number" &&
  now - plant.notify_lease < LEASE_MS;

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
 * Writes `changes` to a plant only if it is still in the "sending" state this
 * run claimed. If the plant was replanned meanwhile (someone watered it), the
 * newer plan is kept.
 */
function settleClaim(db, ref, lease, changes) {
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return;
    const plant = snap.data();
    if (plant.notify_stage !== "sending" || plant.notify_lease !== lease) return;
    transaction.update(ref, changes);
  });
}

/**
 * One run of sendWateringReminders. Each plant is claimed first, by writing
 * as "sending" with a `lastUpdateTime` precondition, and the push goes out
 * only once the claim succeeds. So if someone waters the plant (or another
 * run gets there first) between the query and the write, the fresh plan is
 * kept and no stale reminder is sent. The stage moves forward only after
 * Expo accepted the push; if it failed the stage is put back, and a claim
 * older than ten minutes counts as failed.
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
      if (leaseIsFresh(plant, now)) {
        // Another run is sending this one right now.
        summary.skipped++;
        continue;
      }
      const step = nextStep(plant, now, await zoneFor(householdId));
      if (!step.send) {
        try {
          await doc.ref.update(step.update, { lastUpdateTime: doc.updateTime });
          summary.cleared++;
        } catch (error) {
          if (!isLostRace(error)) throw error;
          summary.skipped++;
        }
        continue;
      }

      // 1. Claim. If someone waters the plant (or another run gets here
      //    first) after the query, the precondition fails and we stop.
      try {
        await doc.ref.update(
          {
            notify_stage: "sending",
            notify_sending: step.send,
            notify_lease: now,
          },
          { lastUpdateTime: doc.updateTime }
        );
      } catch (error) {
        if (!isLostRace(error)) throw error;
        summary.skipped++;
        continue;
      }

      // 2. Send. 3. Confirm (advance the stage) only once Expo accepted it;
      //    otherwise put the stage back so the next run tries again.
      const name = plantName(plant, await basePlantName(db, plant));
      const message = reminderMessage({
        plant,
        plantId: doc.id,
        householdId,
        name,
        stage: step.send,
      });
      try {
        summary.devices += await send(
          db,
          recipientsFor(plant),
          message,
          "reminders"
        );
      } catch (error) {
        await settleClaim(db, doc.ref, now, {
          notify_stage: step.send,
          notify_sending: null,
          notify_lease: null,
        }).catch(() => {}); // the lease runs out and the next run retries
        throw error;
      }
      await settleClaim(db, doc.ref, now, step.update);
      summary[step.send]++;
    } catch (error) {
      summary.failed++;
      log.error("Reminder failed", {
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
    const db = admin.db();
    const now = Date.now();
    const summary = await sendDueReminders({ db, now });
    log.info("sendWateringReminders finished", summary);
    if (summary.found === BATCH_LIMIT) {
      log.warn(
        "sendWateringReminders hit its batch limit; the rest wait for the next run"
      );
    }
    // Delivery results for every push sent earlier (reminders and housemate
    // activity). A failure here must not fail the run that sent reminders.
    try {
      const receipts = await checkPushReceipts(db, now);
      if (receipts.checked > 0) log.info("Push receipts checked", receipts);
    } catch (error) {
      log.error("Push receipt check failed", {
        message: error && error.message,
      });
    }
  });

module.exports = {
  BATCH_LIMIT,
  LEASE_MS,
  needsPlan,
  reminderPlan,
  planReminder,
  nextStep,
  recipientsFor,
  sendDueReminders,
  sendWateringReminders,
};
