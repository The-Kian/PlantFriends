import { useState, useEffect } from "react";

import { IPlant } from "@/constants/IPlant";
import fetchFirebasePlants from "@/helpers/firebase/fetchFirebasePlants";
import { fetchPerenualPlants } from "@/helpers/plants/plantAPI/fetchPlantAPI";

export const useCombinedPlantSearch = (searchQuery: string) => {
  const [plants, setPlants] = useState<IPlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce logic: Update `debouncedQuery` after a delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler); // Clear timeout if searchQuery changes
    };
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      setPlants([]);
      return;
    }

    const fetchPlants = async () => {
      setLoading(true);
      setError(null);
      try {
        const firebasePlants = (await fetchFirebasePlants(debouncedQuery)) || [];

        // Fetch external API but don't let it fail the whole search —
        // if the external API errors (404, network, etc.) we still want
        // to show Firebase results.
        let apiPlants: IPlant[] = [];
        try {
          apiPlants = (await fetchPerenualPlants(debouncedQuery)) || [];
        } catch (apiErr) {
          console.warn(
            "Perenual API fetch failed, continuing with Firebase results:",
            apiErr,
          );
          setError(apiErr as Error);
        }

        // Combine and deduplicate plants based on `id` or `name`
        const combinedPlants = [...firebasePlants, ...apiPlants];
        const uniquePlants = combinedPlants.filter(
          (plant, index, self) =>
            index ===
            self.findIndex((p) => p.id === plant.id || p.name === plant.name),
        );

        setPlants(uniquePlants);
      } catch (err) {
        setError(err as Error);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, [debouncedQuery]);

  return { plants, loading, error };
};
