/**
 * Small reads the notification functions share. Each one fails soft, so a
 * missing household or species never stops a push.
 */

/** The household's IANA time zone, or "UTC". */
async function householdTimeZone(db, householdId) {
  const snap = await db.doc(`Households/${householdId}`).get();
  return (snap.exists && snap.get("timeZone")) || "UTC";
}

/** The catalog name of a plant's species, or null. */
async function basePlantName(db, plant) {
  if (!plant.plantId) return null;
  try {
    const snap = await db.doc(`Plants/${plant.plantId}`).get();
    return snap.exists ? snap.get("name") || null : null;
  } catch {
    return null;
  }
}

module.exports = { householdTimeZone, basePlantName };
