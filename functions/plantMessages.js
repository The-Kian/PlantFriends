/**
 * Decides who hears about a plant and what the push says. Pure functions,
 * so they can be tested without Firestore; functions/notifications.js wires
 * them up.
 */

const { nextAllowedTime } = require("./notifyAt");

const DAY_MS = 24 * 60 * 60 * 1000;

function plantName(plant, basePlantName) {
  return (
    (plant.custom_name && plant.custom_name.trim()) ||
    (plant.custom_attributes && plant.custom_attributes.name) ||
    basePlantName ||
    "plant"
  );
}

// "Thu" within the next week, otherwise "12 Oct".
function formatDue(epochMs, now, timeZone) {
  const withinWeek = epochMs - now < 6 * DAY_MS;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timeZone || "UTC",
    ...(withinWeek ? { weekday: "short" } : { day: "numeric", month: "short" }),
  }).format(new Date(epochMs));
}

/** True when this write is a watering (not an edit, create or delete). */
function isWatering(before, after) {
  return Boolean(
    before &&
      after &&
      after.last_watered_by &&
      after.last_watered_date &&
      after.last_watered_date !== before.last_watered_date,
  );
}

/**
 * The "already watered" pushes for a watering: one message per group of
 * recipients. The person who watered it gets nothing.
 */
function wateredMessages({ plant, plantId, householdId, name, now, timeZone }) {
  const waterer = plant.last_watered_by_name || "A housemate";
  const others = (plant.carerIds || []).filter(
    (uid) => uid !== plant.last_watered_by,
  );
  if (others.length === 0) return [];

  const nextDue = plant.next_watering_date
    ? ` Next due ${formatDue(plant.next_watering_date, now, timeZone)}.`
    : "";
  const data = { plantId, householdId, type: "watered" };
  const body = `No need to water it.${nextDue}`;

  // On someone's own plant it's "your Monstera"; on a shared one, "the Monstera".
  const owner = !plant.shared ? plant.addedBy : null;
  const messages = [];
  if (owner && others.includes(owner)) {
    messages.push({
      uids: [owner],
      message: { title: `${waterer} watered your ${name} 💧`, body, data },
    });
  }
  const rest = others.filter((uid) => uid !== owner);
  if (rest.length > 0) {
    messages.push({
      uids: rest,
      message: { title: `${waterer} watered the ${name} 💧`, body, data },
    });
  }
  return messages;
}

/** The reminder or nudge for a plant whose `notify_at` has come. */
function reminderMessage({ plant, plantId, householdId, name }) {
  const data = { plantId, householdId, type: plant.notify_stage || "due" };
  const shared = plant.shared && (plant.carerIds || []).length > 1;

  if (plant.notify_stage === "nudge") {
    return {
      title: `The ${name} is still thirsty 💧`,
      body: shared
        ? "Nobody has watered it yet. Tap Watered once it's done."
        : "It's overdue. Tap Watered once it's done.",
      data,
    };
  }
  if (shared) {
    return {
      title: `The ${name} needs watering 💧`,
      body: "Whoever gets there first, tap Watered.",
      data,
    };
  }
  return {
    title: `Time to water the ${name} 💧`,
    body: "It's due today.",
    data,
  };
}

/**
 * The reminder plan for a plant after a write: when its next push is due,
 * and which push it is. Returns null when nothing needs to change.
 */
function planAfterWrite(before, after, now, timeZone) {
  const changed =
    !before ||
    after.next_watering_date !== before.next_watering_date ||
    after.reminders_enabled !== before.reminders_enabled;
  if (!changed) return null;

  if (after.reminders_enabled === false || !after.next_watering_date) {
    if (after.notify_at == null && after.notify_stage == null) return null;
    return { notify_at: null, notify_stage: null };
  }

  // Long overdue (e.g. migrated from an older build): one nudge, not a
  // reminder followed straight away by a nudge.
  if (after.next_watering_date < now - DAY_MS) {
    return { notify_at: nextAllowedTime(now, timeZone), notify_stage: "nudge" };
  }
  return {
    notify_at: nextAllowedTime(after.next_watering_date, timeZone),
    notify_stage: "due",
  };
}

/** The plan once a push has gone out: a nudge after a reminder, then stop. */
function planAfterSend(plant, now, timeZone) {
  if (plant.notify_stage === "due" && plant.next_watering_date) {
    const nudgeAt = Math.max(plant.next_watering_date + DAY_MS, now + 60 * 1000);
    return { notify_at: nextAllowedTime(nudgeAt, timeZone), notify_stage: "nudge" };
  }
  return { notify_at: null, notify_stage: null };
}

module.exports = {
  DAY_MS,
  plantName,
  formatDue,
  isWatering,
  wateredMessages,
  reminderMessage,
  planAfterWrite,
  planAfterSend,
};
