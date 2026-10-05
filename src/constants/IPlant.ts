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
  /** Timestamp (ms) when the plant was added */
  date_added?: number;
  /** Last watered timestamp (ms since epoch) */
  last_watered_date?: number | null;
  /** Next scheduled watering timestamp (ms since epoch) */
  next_watering_date?: number | null;
  /** Whether reminders are enabled */
  reminders_enabled?: boolean;
  /** Custom watering schedule in days */
  custom_watering_schedule?: number | null;
  /** Custom notes added by the user */
  custom_notes?: string;
  /** Physical location or notes on where the plant is kept */
  location?: string;
  /** Specific house location (e.g., 'Kitchen', 'Living Room') */
  houseLocation?: string;
  /** Whether the plant is marked as a favorite */
  is_favorite?: boolean;
  /** uid of the household member who added the plant */
  addedBy?: string | null;
  /** uids that get this plant's reminders and hear when someone else waters it */
  carerIds?: string[];
  /** Whether every household member looks after this plant */
  shared?: boolean;
  /** uid of whoever logged the last watering */
  last_watered_by?: string | null;
  /** Display name of whoever logged the last watering (denormalised) */
  last_watered_by_name?: string | null;
  /** When the next push for this plant is due (ms). Set by Cloud Functions only. */
  notify_at?: number | null;
  /** Which push `notify_at` is for. Set by Cloud Functions only. */
  notify_stage?: "due" | "nudge" | null;
}

/**
 * A household: housemates who share one set of plants.
 * Stored at `Households/{id}`; plants live in its `Plants` subcollection.
 */
export interface IHousehold {
  id: string;
  name: string;
  /** uids of every member; used by the security rules */
  memberIds: string[];
  /** Display names, so the UI doesn't need to read other users' profiles */
  members: Record<string, { displayName: string }>;
  createdBy: string;
  /** IANA time zone, used for quiet hours */
  timeZone?: string;
}

/** Per-user notification switches, stored on `Users/{uid}.notificationPrefs`. */
export interface INotificationPrefs {
  /** Watering reminders and the "still thirsty" nudge */
  reminders?: boolean;
  /** "Sam watered your Monstera" */
  housemateActivity?: boolean;
}

/**
 * A merged representation when a user plant can be enriched with base plant data.
 * Contains all user-specific fields plus optional base/species fields.
 */
export type IUserPlantMerged = IUserPlant & Partial<IPlant>;
