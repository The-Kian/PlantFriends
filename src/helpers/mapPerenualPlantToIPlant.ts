import { IPlant } from "@constants/IPlant";

export const mapPerenualPlantToIPlant = (plant: any): IPlant => {
  const isValidField = (field: string | undefined): boolean =>
    field !== undefined && !field.includes("Upgrade Plans To Premium");

  const images = [];
  if (plant.default_image) {
    images.push(plant.default_image.original_url);
    images.push(plant.default_image.regular_url);
    images.push(plant.default_image.medium_url);
    images.push(plant.default_image.small_url);
    images.push(plant.default_image.thumbnail);
  }

  return {
    id: plant.id,
    attributes: {
      name: plant.common_name || plant.scientific_name[0] || "",
      slug: plant.slug,
      scientific_name: plant.scientific_name[0] || [],
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
        planting_season: "",
        harvest_season: "",
        mature_size: "",
    },
  };
};
