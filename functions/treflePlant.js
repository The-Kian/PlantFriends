"use strict";

// Replicates the client-side `mapTreflePlantToIPlant` mapping so the client
// receives IPlant objects directly.
function mapTreflePlantToIPlant(plant) {
  let wateringFrequency = 0;
  if (plant.watering) {
    const dayMatch = plant.watering.match(/\d+/);
    if (dayMatch) {
      wateringFrequency = parseInt(dayMatch[0], 10);
    } else if (plant.watering.toLowerCase().includes("daily")) {
      wateringFrequency = 1;
    } else if (plant.watering.toLowerCase().includes("weekly")) {
      wateringFrequency = 7;
    } else if (plant.watering.toLowerCase().includes("monthly")) {
      wateringFrequency = 30;
    }
  }

  let tempMin = 0;
  let tempMax = 0;
  if (plant.temperature_minimum && plant.temperature_minimum.deg_c) {
    tempMin = plant.temperature_minimum.deg_c;
  }
  if (plant.temperature_maximum && plant.temperature_maximum.deg_c) {
    tempMax = plant.temperature_maximum.deg_c;
  }

  let matureSize = "";
  if (plant.average_height_value && plant.average_height_unit) {
    matureSize = `~${plant.average_height_value}${plant.average_height_unit}`;
  } else if (plant.maximum_height && plant.maximum_height.cm) {
    matureSize = `Up to ${plant.maximum_height.cm}cm`;
  }

  const descriptionParts = [];
  if (plant.growth_habit)
    descriptionParts.push(`Growth: ${plant.growth_habit}`);
  if (plant.edibility) descriptionParts.push(`Edible: ${plant.edibility}`);
  if (plant.invasive) descriptionParts.push("⚠️ Invasive species");
  const description = descriptionParts.join(" | ");

  const images = [];
  if (plant.image_url) images.push(plant.image_url);
  if (plant.images && Array.isArray(plant.images)) {
    plant.images.forEach((img) => {
      if (img.url) images.push(img.url);
    });
  }

  return {
    id: String(plant.id),
    name: plant.common_name || plant.scientific_name || "Unknown Plant",
    slug: plant.slug || "",
    scientific_name: [plant.scientific_name],
    common_names: plant.synonyms || [],
    description:
      description ||
      (plant.family ? `A plant in the ${plant.family} family` : "A plant"),
    sun_requirements: plant.light || "",
    watering_frequency: wateringFrequency,
    fertilizer_needs: plant.soil || "",
    temperature_minimum: tempMin,
    temperature_maximum: tempMax,
    humidity_requirements: "",
    growth_rate: plant.growth_rate || "",
    pruning_needs: "",
    pest_susceptibility: [],
    toxicity: plant.restrictions || "",
    images: images.filter(Boolean),
    mature_size: matureSize,
    contributedBy: "Trefle API",
    isVerified: plant.status === "accepted",
  };
}

/**
 * A catalogue (`Plants`) entry for a mapped Trefle plant: the same shape the
 * app saves when someone adds a plant (saveBasePlantToFirebase.ts), with
 * empty values left out and `contributed_by` set to "Trefle".
 */
function catalogueEntry(plant) {
  const entry = Object.fromEntries(
    Object.entries({
      ...plant,
      slug: plant.name ? plant.name.toLowerCase() : "",
      contributed_by: "Trefle",
      isVerified: false,
    }).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
  return entry;
}

/**
 * Saves search results the catalogue doesn't have yet, so the next search
 * for them is answered from our own database instead of Trefle. Existing
 * entries are never overwritten. Returns how many were added.
 */
async function saveToCatalogue(db, plants) {
  const named = plants.filter((p) => p.id && (p.name || (p.scientific_name || [])[0]));
  if (named.length === 0) return 0;
  const refs = named.map((p) => db.collection("Plants").doc(String(p.id)));
  const snaps = await db.getAll(...refs);
  const batch = db.batch();
  let added = 0;
  snaps.forEach((snap, i) => {
    if (snap.exists) return;
    batch.set(refs[i], catalogueEntry(named[i]));
    added += 1;
  });
  if (added > 0) await batch.commit();
  return added;
}

module.exports = { mapTreflePlantToIPlant, catalogueEntry, saveToCatalogue };
