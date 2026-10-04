// Fields copied from a UserPlant into AnonymousPlants when an account is
// deleted. Only structured, non-identifying data is kept: no uid, names,
// notes or other free text the user typed.
const ANONYMOUS_PLANT_FIELDS = [
  "plantId",
  "houseLocation",
  "date_added",
  "last_watered_date",
  "next_watering_date",
  "custom_watering_schedule",
  "reminders_enabled",
  "is_favorite",
];
const ANONYMOUS_CUSTOM_ATTRIBUTE_FIELDS = [
  "watering_frequency",
  "temperature_minimum",
  "temperature_maximum",
];

function pickDefined(source, fields) {
  const result = {};
  fields.forEach((field) => {
    if (source && source[field] !== undefined) {
      result[field] = source[field];
    }
  });
  return result;
}

function anonymiseUserPlant(userPlant) {
  const anonymous = pickDefined(userPlant, ANONYMOUS_PLANT_FIELDS);
  const customAttributes = pickDefined(
    userPlant.custom_attributes,
    ANONYMOUS_CUSTOM_ATTRIBUTE_FIELDS,
  );
  if (Object.keys(customAttributes).length > 0) {
    anonymous.custom_attributes = customAttributes;
  }
  return anonymous;
}

module.exports = { anonymiseUserPlant, ANONYMOUS_PLANT_FIELDS };
