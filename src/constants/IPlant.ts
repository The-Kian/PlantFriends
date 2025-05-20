/**
 * Interface representing general plant information.
 */
export interface IPlant {
  id: string;
  /** Common name of the plant species */
  name?: string;
  /** URL-friendly name */
  slug?: string;
  /** Scientific names of the plant species */
  scientific_name?: string[];
  /** Other common names */
  common_names?: string[];
  /** Description of the plant */
  description?: string;
  /** Sunlight requirements */
  sun_requirements?: string;
  /** General watering frequency in days */
  watering_frequency?: number;
  /** Fertilizer needs */
  fertilizer_needs?: string;
  /** Minimum temperature tolerance */
  temperature_minimum?: number;
  /** Maximum temperature tolerance */
  temperature_maximum?: number;
  /** Humidity requirements */
  humidity_requirements?: string;
  /** Growth rate */
  growth_rate?: string;
  /** Pruning needs */
  pruning_needs?: string;
  /** Susceptibility to pests */
  pest_susceptibility?: string[];
  /** Toxicity information */
  toxicity?: string;
  /** Image URLs or local paths */
  images?: string[];
  /** Growing season */
  growing_season?: string;
  /** Mature size */
  mature_size?: string;
  /** Contributor's identifier (e.g., 'admin' or user ID) */
  contributedBy?: string;
  /** Verification status */
  isVerified?: boolean;
}

/**
 * Interface representing a user's specific plant instance.
 * Contains customization and tracking information for a user's plant.
 */
export interface IUserPlant {
  /** @string Unique identifier for the user plant instance */
  id: string;
  /** Identifier for the user who owns the plant */
  userId: string;
  /** Identifier for the plant species (references IPlant.id) */
  plantId: string;
  /** Overrides for plant properties */
  custom_attributes?: Partial<IPlant>;
  /** Custom name given by the user */
  custom_name?: string;
  /** Date when the plant was added */
  date_added?: Date;
  /** Last date the plant was watered */
  last_watered_date?: Date | null;
  /** Next scheduled watering date */
  next_watering_date?: Date | null;
  /** Whether reminders are enabled */
  reminders_enabled?: boolean;
  /** Custom watering schedule in days */
  custom_watering_schedule?: string;
  /** Custom notes added by the user */
  custom_notes?: string;
  /** Physical location or notes on where the plant is kept */
  location?: string;
  /** Specific house location (e.g., 'Kitchen', 'Living Room') */
  houseLocation?: string;
  /** Whether the plant is marked as a favorite */
  is_favorite?: boolean;
}
