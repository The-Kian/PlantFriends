import { IPlant } from "@constants/IPlant";

export const mapOpenFarmPlantToIPlant = (plant: any): IPlant => {
    const attributes = plant.attributes || {};
  
    // Handle images
    const images = attributes.images
      ? attributes.images.map((img: any) => img.image_url).filter(Boolean)
      : [];
  
    return {
      id: plant.id.toString(),
      attributes: {
        name: attributes.name || '',
        slug: attributes.slug || '',
        scientific_name: attributes.scientific_name
          ? [attributes.scientific_name]
          : [],
        common_names: attributes.common_names || [],
        description: attributes.description || '',
        sun_requirements: attributes.sun_requirements || '',
        watering_frequency: 0, 
        temperature_minimum: 0, 
        temperature_maximum: 0,
        humidity_requirements: '', 
        growth_rate: '', 
        pruning_needs: '', 
        pest_susceptibility: [], 
        toxicity: '',
        images: images,
        planting_season: '', 
        harvest_season: '', 
        mature_size: attributes.height || '', 
      },
    };
  };
  