/* eslint-disable @typescript-eslint/no-explicit-any */
import { IPlant } from "@constants/IPlant";

export const mapPerenualPlantToIPlant = (plant: any): IPlant => {
  const isValidField = (field: string | undefined): boolean =>
    typeof field === "string" && !field.includes("Upgrade Plans To Premium");

  const images: string[] = [];

  // Handle default images
  if (plant.default_image) {
    const defaultImage = plant.default_image;
    if (defaultImage.original_url) {
      images.push(defaultImage.original_url);
    }
    if (defaultImage.regular_url) {
      images.push(defaultImage.regular_url);
    }
    if (defaultImage.medium_url) {
      images.push(defaultImage.medium_url);
    }
    if (defaultImage.small_url) {
      images.push(defaultImage.small_url);
    }
    if (defaultImage.thumbnail) {
      images.push(defaultImage.thumbnail);
    }
  }

  // Handle additional images
  if (Array.isArray(plant.images)) {
    plant.images.forEach((imgObj: any) => {
      if (imgObj?.url) {
        images.push(imgObj.url);
      }
    });
  }

  return {
    id: plant.id.toString(),
    name: plant.common_name || (plant.scientific_name && plant.scientific_name[0]) || "",
    slug: plant.slug || "",
    scientific_name: plant.scientific_name || [],
    common_names: plant.other_name || [],
    description: plant.description || "",
    sun_requirements: isValidField(plant.sunlight) ? plant.sunlight : "",
    watering_frequency: plant.watering || 0,
    fertilizer_needs: "",
    temperature_minimum: plant.temperature_min || 0,
    temperature_maximum: plant.temperature_max || 0,
    humidity_requirements: "",
    growth_rate: "",
    pruning_needs: "",
    pest_susceptibility: [],
    toxicity: "",
    images: images.filter(Boolean),
    mature_size: "",
    contributedBy: "Perenual API",
    isVerified: false,
  };
};
