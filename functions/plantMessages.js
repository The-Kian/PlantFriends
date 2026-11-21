/**
 * Decides who hears about a watering and what the push says. Pure functions,
 * so they can be tested without Firestore; functions/notifications.js wires
 * them up.
 */

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
  const options = withinWeek
    ? { weekday: "short" }
    : { day: "numeric", month: "short" };
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: timeZone || "UTC", ...options }).format(
      new Date(epochMs),
    );
  } catch {
    // An unknown time zone name.
    return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options }).format(new Date(epochMs));
  }
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

  const nextDue =
    plant.next_watering_date && plant.next_watering_date > now
      ? ` Next due ${formatDue(plant.next_watering_date, now, timeZone)}.`
      : "";
  const data = { plantId, householdId, type: "watered" };
  const body = `No need to water it.${nextDue}`;

  // On someone's own plant it's "your Monstera"; on a shared one, "the Monstera".
  // A nickname takes no article: "Sam watered Monty".
  const nickname = Boolean(plant.custom_name && plant.custom_name.trim());
  const yours = nickname ? name : `your ${name}`;
  const the = nickname ? name : `the ${name}`;
  const owner = !plant.shared ? plant.addedBy : null;
  const messages = [];
  if (owner && others.includes(owner)) {
    messages.push({
      uids: [owner],
      message: { title: `${waterer} watered ${yours} 💧`, body, data },
    });
  }
  const rest = others.filter((uid) => uid !== owner);
  if (rest.length > 0) {
    messages.push({
      uids: rest,
      message: { title: `${waterer} watered ${the} 💧`, body, data },
    });
  }
  return messages;
}

/**
 * The "time to water" push (stage "due") or the one follow-up a day later
 * (stage "nudge"). Every carer gets the same message.
 */
function reminderMessage({ plant, plantId, householdId, name, stage }) {
  const data = { plantId, householdId, type: stage };
  if (stage === "nudge") {
    return {
      title: `The ${name} is still thirsty 🥀`,
      body: "It was due yesterday. Tap Watered once it's done.",
      data,
    };
  }
  if (plant.shared) {
    return {
      title: `The ${name} needs watering 💧`,
      body: "Whoever gets there first, tap Watered.",
      data,
    };
  }
  return {
    title: `Time to water the ${name} 💧`,
    body: "Tap Watered once it's done.",
    data,
  };
}

module.exports = {
  DAY_MS,
  plantName,
  formatDue,
  isWatering,
  wateredMessages,
  reminderMessage,
};
