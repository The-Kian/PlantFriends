import { useState } from "react";

import { IPlant } from "@/constants/IPlant";
import fetchFirebasePlants from "@/helpers/fetchFirebasePlants";

export const useFirebasePlantSearch = (searchQuery: string) => {
  const [plants, setPlants] = useState<IPlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlants = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPlants = await fetchFirebasePlants(searchQuery);
      setPlants(fetchedPlants);
    } catch (err) {
      setError("Failed to fetch plants");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { plants, loading, error, searchPlants };
};
