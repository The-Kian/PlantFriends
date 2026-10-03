import { useState, useEffect } from "react";

import { IPlant } from "@/constants/IPlant";
import fetchFirebasePlants from "@/helpers/firebase/fetchFirebasePlants";
import { fetchTreflePlants } from "@/helpers/plants/plantAPI/fetchTreflePlants";
import ErrorService from "@/services/ErrorService";

export const useCombinedPlantSearch = (searchQuery: string) => {
  const [plants, setPlants] = useState<IPlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const query = searchQuery.trim();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce logic: Update `debouncedQuery` after a delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler); // Clear timeout if searchQuery changes
    };
  }, [query]);

  useEffect(() => {
    // Invalidate the previous request immediately, even during debounce.
    let active = true;
    if (!query) {
      setPlants([]);
      setLoading(false);
      setError(null);
      setDebouncedQuery("");
      return;
    }

    if (query !== debouncedQuery) {
      setLoading(false);
      setError(null);
      return;
    }

    const fetchPlants = async () => {
      setLoading(true);
      setError(null);
      try {
        const firebasePlants = (await fetchFirebasePlants(debouncedQuery)) || [];
        if (!active) return;

        // Fetch from Trefle API but don't let it fail the whole search —
        // if the external API errors (404, network, etc.) we still want
        // to show Firebase results. Cached results will be used if available.
        let apiPlants: IPlant[] = [];
        try {
          apiPlants = (await fetchTreflePlants(debouncedQuery)) || [];
        } catch (apiErr) {
          if (!active) return;
          console.warn(
            "Trefle API fetch failed, continuing with Firebase results:",
            apiErr,
          );
          setError(apiErr as Error);
        }
        if (!active) return;

        // Combine and deduplicate plants based on `id` or `name`
        const combinedPlants = [...firebasePlants, ...apiPlants];
        const uniquePlants = combinedPlants.filter(
          (plant, index, self) =>
            index ===
            self.findIndex((p) => p.id === plant.id || p.name === plant.name),
        );

        setPlants(uniquePlants);
      } catch (err) {
        if (!active) return;
        setError(err as Error);
        ErrorService.handleError(err, "Search Plants");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPlants();
    return () => {
      active = false;
    };
  }, [debouncedQuery, query]);

  return { plants, loading, error };
};
