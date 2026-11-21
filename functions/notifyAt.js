/**
 * Quiet hours for reminders. Nothing is sent between 21:00 and 08:00 in the
 * household's time zone; a reminder that falls due then waits until 08:00.
 *
 * Pure functions with no Firestore, so they can be tested on their own.
 */

const QUIET_FROM_HOUR = 21;
const QUIET_UNTIL_HOUR = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

function validTimeZone(timeZone) {
  if (!timeZone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** The wall-clock date and hour at `epochMs` in `timeZone`. */
function localParts(epochMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(epochMs));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** How far `timeZone` is ahead of UTC at `epochMs`, in milliseconds. */
function offsetAt(epochMs, timeZone) {
  const p = localParts(epochMs, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

/**
 * The instant a wall clock in `timeZone` shows `hour`:00 on the given date.
 * The offset is looked up twice, so a clock change between midnight and
 * `hour` is handled.
 */
function wallClockToEpoch({ year, month, day }, hour, timeZone) {
  const naive = Date.UTC(year, month - 1, day, hour);
  let guess = naive - offsetAt(naive, timeZone);
  guess = naive - offsetAt(guess, timeZone);
  return guess;
}

/**
 * Moves `epochMs` out of quiet hours in `timeZone`. Times from 08:00 to
 * 20:59 are kept as they are; 21:00 to 07:59 move to the next 08:00.
 */
function notifyAt(epochMs, timeZone) {
  const zone = validTimeZone(timeZone);
  const local = localParts(epochMs, zone);
  if (local.hour >= QUIET_UNTIL_HOUR && local.hour < QUIET_FROM_HOUR) {
    return epochMs;
  }
  let date = local;
  if (local.hour >= QUIET_FROM_HOUR) {
    // The next calendar day. Noon UTC on the same date plus a day can't be
    // pushed onto the wrong date by any offset or clock change.
    const next = new Date(Date.UTC(local.year, local.month - 1, local.day, 12) + DAY_MS);
    date = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
  }
  return wallClockToEpoch(date, QUIET_UNTIL_HOUR, zone);
}

/** True when `epochMs` falls in quiet hours (21:00 to 07:59) in `timeZone`. */
function inQuietHours(epochMs, timeZone) {
  const { hour } = localParts(epochMs, validTimeZone(timeZone));
  return hour >= QUIET_FROM_HOUR || hour < QUIET_UNTIL_HOUR;
}

module.exports = { notifyAt, inQuietHours, localParts, QUIET_FROM_HOUR, QUIET_UNTIL_HOUR, DAY_MS };
