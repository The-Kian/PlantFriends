/**
 * Quiet hours for push notifications. Nothing is sent between 21:00 and
 * 08:00 in the household's time zone; a push that falls in that window waits
 * until 08:00.
 */

const QUIET_END_HOUR = 8; // first hour pushes may go out
const QUIET_START_HOUR = 21; // first hour they may not
const STEP_MS = 15 * 60 * 1000;

function localHour(epochMs, timeZone) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date(epochMs));
  return Number(hour);
}

function validTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

function isQuiet(epochMs, timeZone) {
  const hour = localHour(epochMs, timeZone);
  return hour < QUIET_END_HOUR || hour >= QUIET_START_HOUR;
}

/**
 * The first moment at or after `epochMs` that is outside quiet hours.
 *
 * Walks forward in 15-minute steps from the next quarter hour. Every time
 * zone offset in use is a whole number of quarter hours, so the first step
 * outside quiet hours is exactly 08:00 local time, including across DST.
 */
function nextAllowedTime(epochMs, timeZone = "UTC") {
  const tz = validTimeZone(timeZone || "UTC");
  if (!isQuiet(epochMs, tz)) {
    return epochMs;
  }
  let t = Math.ceil(epochMs / STEP_MS) * STEP_MS;
  // Quiet hours are 11 hours long, so this ends well within a day.
  for (let i = 0; i < 24 * 4 && isQuiet(t, tz); i += 1) {
    t += STEP_MS;
  }
  return t;
}

module.exports = { nextAllowedTime, isQuiet, QUIET_END_HOUR, QUIET_START_HOUR };
