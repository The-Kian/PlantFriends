export interface IPlant {
  id: string;
  attributes: {
    name: string;
    slug: string;
    binomial_name?: string;
    common_names?: string[];
    description?: string;
    sun_requirements?: string;
    water_requirements?: string;
    temperature_minimum?: number;
    temperature_maximum?: number;
  };
}
