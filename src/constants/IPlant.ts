export interface IPlant {
  id: string;
  attributes: {
    // General Plant Information
    name: string;
    slug: string;
    scientific_name?: string[];
    common_names?: string[];
    description?: string;
    sun_requirements?: "Full Sun" | "Partial Sun" | "Partial Shade" | "Full Shade" | "";
    watering_frequency?: number; // Number of days between watering
    fertilizer_needs?: string;
    temperature_minimum?: number;
    temperature_maximum?: number;
    humidity_requirements?: string;
    growth_rate?: "Slow" | "Moderate" | "Fast" | "";
    pruning_needs?: string;
    pest_susceptibility?: string[];
    toxicity?: string; // Information about toxicity to pets or humans
    images?: string[]; // URLs or local paths 
    planting_season?: string;
    harvest_season?: string; 
    mature_size?: string; 
  };
  user_data?: {
    custom_name?: string;
    date_added?: Date;
    last_watered_date?: Date;
    next_watering_date?: Date;
    reminders_enabled?: boolean;
    notes?: string;
    location?: string;
    is_favorite?: boolean;
  };
}
