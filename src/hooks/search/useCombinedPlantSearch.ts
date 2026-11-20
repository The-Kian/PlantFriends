import { useState, useEffect } from "react";

import { IPlant } from "@/constants/IPlant";
import fetchFirebasePlants from "@/helpers/firebase/fetchFirebasePlants";
import { fetchTreflePlants } from "@/helpers/plants/plantAPI/fetchTreflePlants";

/** One letter matches half the catalogue; wait for a second. */
export const MIN_QUERY_LENGTH = 2;

const firstScientificName = (plant: IPlant) =>
  plant.scientific_name?.[0]?.trim().toLowerCase() || null;

export const useCombinedPlantSearch = (searchQuery: string) => {
  const [plants, setPlants] = useState<IPlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // True once a search for the current query has finished, so the screen can
  // tell "no matches" from "still typing".
  const [searched, setSearched] = useState(false);
  const trimmed = searchQuery.trim();
  const query = trimmed.length >= MIN_QUERY_LENGTH ? trimmed : "";
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
      setSearched(false);
      setDebouncedQuery("");
      return;
    }

    if (query !== debouncedQuery) {
      setLoading(false);
      setError(null);
      setSearched(false);
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
          // Keep the Firebase results; the screen explains the rest.
          setError(apiErr as Error);
        }
        if (!active) return;

        // The same species can come from both: "Monstera Deliciosa" in the
        // catalogue and "Fruit-salad-plant" (Monstera deliciosa) from Trefle.
        // Keep the catalogue's, which is the one that gets saved and edited.
        const catalogue = new Set(
          firebasePlants.map(firstScientificName).filter(Boolean),
        );
        const newFromApi = apiPlants.filter((plant) => {
          const scientific = firstScientificName(plant);
          return !scientific || !catalogue.has(scientific);
        });

        // Combine and deduplicate plants based on `id` or `name`
        const combinedPlants = [...firebasePlants, ...newFromApi];
        const uniquePlants = combinedPlants.filter(
          (plant, index, self) =>
            index ===
            self.findIndex((p) => p.id === plant.id || p.name === plant.name),
        );

        setPlants(uniquePlants);
      } catch (err) {
        if (!active) return;
        // Reported by fetchFirebasePlants; the screen shows the message.
        setError(err as Error);
      } finally {
        if (active) {
          setLoading(false);
          setSearched(true);
        }
      }
    };

    fetchPlants();
    return () => {
      active = false;
    };
  }, [debouncedQuery, query]);

  return { plants, loading, error, searched };
};
