import { useState, useEffect } from "react";

import { IPlant } from "@/constants/IPlant";
import fetchFirebasePlants from "@/helpers/firebase/fetchFirebasePlants";
import { fetchTreflePlants } from "@/helpers/plants/plantAPI/fetchTreflePlants";

/** Searches shorter than this are too broad to be useful. */
export const MIN_SEARCH_LENGTH = 2;

const firstScientificName = (plant: IPlant) =>
  plant.scientific_name?.[0]?.trim().toLowerCase() ?? "";

/**
 * The catalogue's plants first, then Trefle's, without repeats: by id or name,
 * and without a Trefle plant whose scientific name is one a catalogue plant
 * already has ("Fruit-salad-plant" next to "Monstera Deliciosa").
 */
export function combineResults(
  catalogue: IPlant[],
  trefle: IPlant[]
): IPlant[] {
  const known = new Set(
    catalogue.map(firstScientificName).filter((name) => name !== "")
  );
  const extra = trefle.filter((plant) => {
    const name = firstScientificName(plant);
    return name === "" || !known.has(name);
  });
  return [...catalogue, ...extra].filter(
    (plant, index, self) =>
      index ===
      self.findIndex((p) => p.id === plant.id || p.name === plant.name)
  );
}

export const useCombinedPlantSearch = (searchQuery: string) => {
  const [plants, setPlants] = useState<IPlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // The query a finished search was for, so the screen can tell "no matches"
  // from "haven't looked yet".
  const [searchedQuery, setSearchedQuery] = useState("");
  const trimmed = searchQuery.trim();
  const query = trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : "";
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
      setSearchedQuery("");
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
        const firebasePlants =
          (await fetchFirebasePlants(debouncedQuery)) || [];
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

        setPlants(combineResults(firebasePlants, apiPlants));
      } catch (err) {
        if (!active) return;
        // Reported by fetchFirebasePlants; the screen shows the message.
        setError(err as Error);
      } finally {
        if (active) {
          setLoading(false);
          setSearchedQuery(debouncedQuery);
        }
      }
    };

    fetchPlants();
    return () => {
      active = false;
    };
  }, [debouncedQuery, query]);

  return {
    plants,
    loading,
    error,
    searched: query !== "" && searchedQuery === query,
  };
};
