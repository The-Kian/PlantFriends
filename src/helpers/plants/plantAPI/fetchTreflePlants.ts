/* eslint-disable import/no-unresolved */

// Import token - add TREFLE_API_KEY to your .env file
let TREFLE_API_KEY: string;
try {
  ({ TREFLE_API_KEY } = require("@env"));
} catch {
  TREFLE_API_KEY = "";
}

import { IPlant } from "@/constants/IPlant";
import ErrorService from "@/services/ErrorService";
import PlantCacheService from "@/services/PlantCacheService";

import { mapTreflePlantToIPlant, TreflePlant } from "./mapTreflePlantToIPlant";

interface TrefleAPIResponse {
  data: TreflePlant[];
  links?: {
    self: string;
    first: string;
    next?: string;
    last: string;
  };
  meta?: {
    total: number;
  };
}

/**
 * Fetch plants from Trefle API
 * Trefle offers comprehensive botanical data with a free tier
 * Rate limit: 60 req/min (free), 600 req/min (GitHub sponsors)
 *
 * Benefits over Perenual:
 * - Larger database (399K+ species vs 11K)
 * - Better data coverage (80% distribution, 89% bibliography)
 * - Free tier is sustainable
 * - Open source
 *
 * Note: Results are cached for 24 hours to minimize API calls
 */
export const fetchTreflePlants = async (searchQuery: string): Promise<IPlant[]> => {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    // Check cache first
    const cached = await PlantCacheService.getSearchResults(searchQuery);
    if (cached) {
      return cached;
    }

    if (!TREFLE_API_KEY) {
      throw new Error("Trefle API key not configured. Add TREFLE_API_KEY to .env file");
    }

    // Trefle search endpoint
    const URL = `https://trefle.io/api/v1/species/search?token=${TREFLE_API_KEY}&q=${searchQuery}&limit=20`;

    const response = await fetch(URL);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid Trefle API token");
      }
      if (response.status === 429) {
        throw new Error("Rate limited by Trefle API - too many requests");
      }
      throw new Error(`Trefle API request failed with status ${response.status}`);
    }

    const data: TrefleAPIResponse = await response.json();

    if (data.data && Array.isArray(data.data)) {
      const plantsData: IPlant[] = data.data.map((plant: TreflePlant) => {
        const mapped = mapTreflePlantToIPlant(plant);
        return mapped;
      });

      // Cache the results
      await PlantCacheService.cacheSearchResults(searchQuery, plantsData);

      return plantsData;
    } else {
      return [];
    }
  } catch (error) {
    ErrorService.handleError(error, "Fetch Trefle Plants");
    throw error;
  }
};

/**
 * Fetch plant details by species ID from Trefle
 * Use this to get additional information about a specific plant
 */
export const fetchTreflePlantById = async (plantId: string): Promise<IPlant | null> => {
  try {
    const URL = `https://trefle.io/api/v1/species/${plantId}?token=${TREFLE_API_KEY}`;

    const response = await fetch(URL);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch plant details: ${response.status}`);
    }

    const data = await response.json();
    const plant = data.data as TreflePlant;

    if (plant) {
      return mapTreflePlantToIPlant(plant);
    }

    return null;
  } catch (error) {
    ErrorService.handleError(error, "Fetch Trefle Plant Details");
    return null;
  }
};

/**
 * Advanced search with filters
 * Optional: Use this for more advanced filtering capabilities
 */
export const searchTreflePlants = async (
  query: string,
  options?: {
    rank?: "species" | "variety" | "subspecies" | "hybrid" | "cultivar";
    family?: string;
    limit?: number;
    page?: number;
  },
): Promise<IPlant[]> => {
  try {
    const params = new URLSearchParams({
      token: TREFLE_API_KEY,
      q: query,
      limit: (options?.limit || 20).toString(),
      page: (options?.page || 1).toString(),
    });

    if (options?.rank) {
      params.append("rank", options.rank);
    }
    if (options?.family) {
      params.append("family_id", options.family);
    }

    const URL = `https://trefle.io/api/v1/species/search?${params.toString()}`;

    const response = await fetch(URL);

    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`);
    }

    const data: TrefleAPIResponse = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data.map((plant) => mapTreflePlantToIPlant(plant));
    }

    return [];
  } catch (error) {
    ErrorService.handleError(error, "Trefle Search Plants");
    throw error;
  }
};
