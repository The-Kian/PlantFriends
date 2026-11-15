/**
 * sendWateringReminders — runs every 15 minutes and sends the pushes that are
 * due: "Time to water the Monstera", then one nudge a day later, then nothing.
 *
 * onPlantWritten (./notifications.js) plans each plant's reminder in
 * `notify_at` and `notify_stage`; this finds the plants whose time has come.
 * See docs/household-sharing-plan.md.
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { sendToUsers } = require("./push");
const { DAY_MS, plantName, reminderMessage } = require("./plantMessages");
const { notifyAt } = require("./notifyAt");
const { householdTimeZone, basePlantName } = require("./notifications");

const FAILED_PRECONDITION = 9; // Firestore's code for a failed precondition

/** Where the plant goes after this push: the nudge a day later, then nothing. */
function afterSending(stage, plant, timeZone, now) {
  if (stage === "due") {
    const due = plant.next_watering_date || now;
    return { notify_stage: "nudge", notify_at: notifyAt(due + DAY_MS, timeZone) };
  }
  return { notify_stage: null, notify_at: null };
}

/**
 * Sends every reminder that is due at `now`. Returns counts for the log.
 * One plant failing doesn't stop the others.
 */
async function runReminders({ db, now, send = sendToUsers }) {
  const snap = await db.collectionGroup("Plants").where("notify_at", "<=", now).get();
  const summary = { due: 0, sent: 0, cleared: 0, skipped: 0, failed: 0 };
  const timeZones = new Map();

  for (const doc of snap.docs) {
    // Only household plants: Households/{id}/Plants/{id}.
    const parts = doc.ref.path.split("/");
    if (parts.length !== 4 || parts[0] !== "Households") continue;
    summary.due += 1;
    const householdId = parts[1];
    const plant = doc.data();
    const stage = plant.notify_stage;

    try {
      if (!timeZones.has(householdId)) {
        timeZones.set(householdId, await householdTimeZone(db, householdId));
      }
      const timeZone = timeZones.get(householdId);
      const carers = plant.carerIds || [];
      const wanted =
        (stage === "due" || stage === "nudge") && plant.reminders_enabled !== false && carers.length > 0;

      if (wanted) {
        const name = plantName(plant, await basePlantName(db, plant));
        await send(
          db,
          carers,
          reminderMessage({ plant, plantId: parts[3], householdId, name, stage }),
          "reminders",
        );
      }

      // Only move on if nobody changed the plant since we read it. If they
      // did (someone watered it), the fresh plan stays.
      await doc.ref.update(
        wanted ? afterSending(stage, plant, timeZone, now) : { notify_stage: null, notify_at: null },
        { lastUpdateTime: doc.updateTime },
      );
      if (wanted) summary.sent += 1;
      else summary.cleared += 1;
    } catch (error) {
      if (error && error.code === FAILED_PRECONDITION) {
        summary.skipped += 1;
      } else {
        summary.failed += 1;
        functions.logger.error("Reminder failed", { householdId, plantId: parts[3], message: error && error.message });
      }
    }
  }
  return summary;
}

const sendWateringReminders = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    const summary = await runReminders({ db: admin.firestore(), now: Date.now() });
    functions.logger.info("Watering reminders", summary);
  });

module.exports = { sendWateringReminders, runReminders, afterSending };
