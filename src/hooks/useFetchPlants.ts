import { IPlant } from "@constants/IPlant";
import { fetchOpenFarmPlants } from "@helpers/plantAPI/fetchPlantAPI";
import { useState, useEffect } from "react";

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
          const plantsData = await fetchOpenFarmPlants(searchQuery);
        // const plantsData = await fetchPerenualPlants(searchQuery);
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
