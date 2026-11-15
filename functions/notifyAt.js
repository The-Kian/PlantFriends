/**
 * Quiet hours for reminders: nothing goes out from 21:00 to 08:00 in the
 * household's time zone. A reminder that falls due then waits until 08:00.
 * Pure functions, so they can be tested without Firestore.
 */

const QUIET_START_HOUR = 21;
const QUIET_END_HOUR = 8;

function formatterFor(timeZone) {
  const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  };
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: timeZone || "UTC", ...options });
  } catch {
    // An unknown time zone name.
    return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options });
  }
}

/** The wall-clock time in `timeZone` at this instant. */
function localParts(epochMs, timeZone) {
  const parts = {};
  for (const { type, value } of formatterFor(timeZone).formatToParts(new Date(epochMs))) {
    parts[type] = Number(value);
  }
  return parts;
}

/** How far the zone's clock is ahead of UTC at this instant, in ms. */
function offsetAt(epochMs, timeZone) {
  const p = localParts(epochMs, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(epochMs / 1000) * 1000;
}

/** The instant when the wall clock in `timeZone` reads this date at `hour`:00. */
function localTimeToEpoch({ year, month, day, hour }, timeZone) {
  const guess = Date.UTC(year, month - 1, day, hour);
  const first = guess - offsetAt(guess, timeZone);
  // The offset can differ at the new time if a clock change falls in between.
  return guess - offsetAt(first, timeZone);
}

/**
 * The time to send a reminder due at `epochMs`: the same time, unless it
 * falls in quiet hours, then the next 08:00 in `timeZone`.
 */
function notifyAt(epochMs, timeZone) {
  const { year, month, day, hour } = localParts(epochMs, timeZone);
  if (hour >= QUIET_END_HOUR && hour < QUIET_START_HOUR) return epochMs;

  // After 21:00 it's 08:00 tomorrow; before 08:00 it's 08:00 today.
  const dayOffset = hour >= QUIET_START_HOUR ? 1 : 0;
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return localTimeToEpoch(
    {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: QUIET_END_HOUR,
    },
    timeZone,
  );
}

/**
 * What to write to a plant's `notify_at` and `notify_stage` after a write, or
 * null if they're already right. They're only replanned when the due date or
 * the reminders switch changed, so the function's own write can't set off
 * another plan (it changes only the two notify fields).
 */
function planReminder({ before, after, timeZone }) {
  if (!after) return null;
  const changed =
    !before ||
    before.next_watering_date !== after.next_watering_date ||
    before.reminders_enabled !== after.reminders_enabled;
  if (!changed) return null;

  const due = after.next_watering_date;
  const on = after.reminders_enabled !== false && typeof due === "number" && due > 0;
  const plan = on
    ? { notify_at: notifyAt(due, timeZone), notify_stage: "due" }
    : { notify_at: null, notify_stage: null };

  const unchanged =
    (after.notify_at ?? null) === plan.notify_at &&
    (after.notify_stage ?? null) === plan.notify_stage;
  return unchanged ? null : plan;
}

module.exports = { notifyAt, planReminder, QUIET_START_HOUR, QUIET_END_HOUR };
