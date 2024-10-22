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
        watering_frequency: undefined, // Not available from OpenFarm
        fertilizer_needs: '', // Not available from OpenFarm
        temperature_minimum: undefined, // Not available from OpenFarm
        temperature_maximum: undefined, // Not available from OpenFarm
        humidity_requirements: '', // Not available from OpenFarm
        growth_rate: '', // Not available from OpenFarm
        pruning_needs: '', // Not available from OpenFarm
        pest_susceptibility: [], // Not available from OpenFarm
        toxicity: '', // Not available from OpenFarm
        images: images,
        planting_season: '', // Not available from OpenFarm
        harvest_season: '', // Not available from OpenFarm
        mature_size: attributes.height || '', // Using 'height' as 'mature_size' if available
      },
    };
  };
  