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

module.exports = { mapTreflePlantToIPlant };
