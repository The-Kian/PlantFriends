import { getFunctions, httpsCallable } from "@react-native-firebase/functions";

import { IPlant } from "@/constants/IPlant";
import { isOfflineError } from "@/helpers/errors/friendlyErrors";
import { recordHandledError } from "@/services/CrashReporting";
import PlantCacheService from "@/services/PlantCacheService";

/**
 * Fetch plants from the Trefle API via a Firebase Cloud Function proxy.
 *
 * The Trefle token lives only on the server (never bundled into the client),
 * so it is not exposed to end users. The Cloud Function returns IPlant[]
 * already mapped to the app's shape.
 *
 * Note: Results are cached for 24 hours to minimize API calls.
 */
export const fetchTreflePlants = async (
  searchQuery: string
): Promise<IPlant[]> => {
  try {
    const query = searchQuery.trim();
    if (!query) {
      return [];
    }

    // Check cache first
    const cached = await PlantCacheService.getSearchResults(query);
    if (cached) {
      return cached;
    }

    // Call the server-side proxy (hides the Trefle token from the client).
    const callable = httpsCallable<{ q: string }, { plants: IPlant[] }>(
      getFunctions(),
      "searchPlants"
    );
    const result = await callable({ q: query });
    const plantsData = result.data?.plants ?? [];

    // Cache the results
    await PlantCacheService.cacheSearchResults(query, plantsData);

    return plantsData;
  } catch (error) {
    // The search screen says what went wrong; no alert on top of it. Being
    // offline isn't a fault worth reporting.
    if (!isOfflineError(error)) {
      recordHandledError(error, "Fetch Trefle Plants");
    }
    throw error;
  }
};
