import { useState, useEffect } from "react";

import { IPlant } from "@constants/IPlant";
import {
  fetchFirebasePlants,
  fetchOpenFarmPlants,
} from "@helpers/plantAPI/fetchPlantAPI";

export const useFetchPlants = (searchQuery: string) => {
  const [plants, setPlants] = useState<IPlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.length === 0) {
      return;
    }

    const fetchPlants = async () => {
      setLoading(true);
      try {
        const openFarmPlantsData = await fetchOpenFarmPlants(searchQuery);
        const firebasePlantsData = await fetchFirebasePlants(searchQuery);

        const plantsData = [...firebasePlantsData, ...openFarmPlantsData];

        setPlants(plantsData);
      } catch (error: any) {
        setError(error);
        console.error(`🚀 ~ fetchPlants ~ error.message:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, [searchQuery]);

  return { plants, loading, error };
};
