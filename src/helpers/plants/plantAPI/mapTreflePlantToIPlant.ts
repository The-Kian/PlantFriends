import { IPlant } from "@/constants/IPlant";

export interface TreflePlant {
  id: number;
  common_name: string;
  scientific_name: string;
  slug: string;
  genus: string;
  family: string;
  family_common_name: string | null;
  image_url: string | null;
  bibliography: string | null;
  author: string | null;
  status: string;
  rank: string;
  year: number;
  synonyms: string[];
  links?: {
    self: string;
    plant: string;
    genus: string;
  };
  // Optional fields that may be populated
  growth_habit?: string;
  average_height?: { cm: number } | null;
  average_height_value?: number | null;
  average_height_unit?: string | null;
  maximum_height?: { cm: number } | null;
  hardiness_zones?: unknown;
  temperature_minimum?: { deg_c: number } | null;
  temperature_maximum?: { deg_c: number } | null;
  growth_rate?: string | null;
  watering?: string | null;
  light?: string | null;
  soil?: string | null;
  edible_parts?: string[] | null;
  edibility?: string | null;
  restrictions?: string | null;
  invasive?: boolean | null;
  propagation?: string[] | null;
  distributions?: unknown[];
  images?: { url: string; caption?: string }[];
}

/**
 * Maps Trefle plant data to PlantFriends IPlant format
 * Trefle has more comprehensive botanical data than Perenual
 */
export const mapTreflePlantToIPlant = (plant: TreflePlant): IPlant => {
  // Extract watering frequency from description if available
  let wateringFrequency = 0;
  if (plant.watering) {
    // Try to extract days from common patterns like "every 7 days" or "weekly"
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

  // Extract temperature info
  let tempMin = 0;
  let tempMax = 0;
  if (plant.temperature_minimum?.deg_c) {
    tempMin = plant.temperature_minimum.deg_c;
  }
  if (plant.temperature_maximum?.deg_c) {
    tempMax = plant.temperature_maximum.deg_c;
  }

  // Extract height info for mature size
  let matureSize = "";
  if (plant.average_height_value && plant.average_height_unit) {
    matureSize = `~${plant.average_height_value}${plant.average_height_unit}`;
  } else if (plant.maximum_height?.cm) {
    matureSize = `Up to ${plant.maximum_height.cm}cm`;
  }

  // Compile description with available data
  const descriptionParts = [];
  if (plant.growth_habit) {
    descriptionParts.push(`Growth: ${plant.growth_habit}`);
  }
  if (plant.edibility) {
    descriptionParts.push(`Edible: ${plant.edibility}`);
  }
  if (plant.invasive) {
    descriptionParts.push("⚠️ Invasive species");
  }
  const description = descriptionParts.join(" | ");

  // Collect images
  const images: string[] = [];
  if (plant.image_url) {
    images.push(plant.image_url);
  }
  if (plant.images && Array.isArray(plant.images)) {
    plant.images.forEach((img) => {
      if (img.url) {
        images.push(img.url);
      }
    });
  }

  return {
    id: plant.id.toString(),
    name: plant.common_name || plant.scientific_name || "Unknown Plant",
    slug: plant.slug || "",
    scientific_name: [plant.scientific_name],
    common_names: plant.synonyms || [],
    description: description || `A ${plant.family} species`,
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
};
