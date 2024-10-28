import { IPlant } from "@constants/IPlant";

export const mapOpenFarmPlantToIPlant = (plant: any): IPlant => {
  const attributes = plant.attributes || {};

  // Handle images
  const images = attributes.images
    ? attributes.images.map((img: any) => img.image_url).filter(Boolean)
    : [];

  return {
    id: plant.id.toString(),
    name: attributes.name || '',
    slug: attributes.slug || '',
    scientific_name: attributes.scientific_name
      ? [attributes.scientific_name]
      : [],
    common_names: attributes.common_names || [],
    description: attributes.description || '',
    sun_requirements: attributes.sun_requirements || '',
    watering_frequency: attributes.watering_frequency || 0,
    temperature_minimum: attributes.temperature_minimum || 0,
    temperature_maximum: attributes.temperature_maximum || 0,
    humidity_requirements: attributes.humidity_requirements || '',
    growth_rate: attributes.growth_rate || '',
    pruning_needs: attributes.pruning_needs || '',
    pest_susceptibility: attributes.pest_susceptibility || [],
    toxicity: attributes.toxicity || '',
    images: images,
    mature_size: attributes.height || '',
    contributedBy: 'OpenFarm API', 
    isVerified: false, 
  };
};
