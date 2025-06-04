/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";

import { IPlant } from "@constants/IPlant";
import { fetchPerenualPlants } from "@helpers/plantAPI/fetchPlantAPI";
import fetchFirebasePlants from "@helpers/fetchFirebasePlants";

export const useFetchAPIPlants = (searchQuery: string) => {
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
        // const plantsData = await fetchOpenFarmPlants(searchQuery);
        const firebasePlants = (await fetchFirebasePlants(searchQuery)) || [];
        const apiPlants = (await fetchPerenualPlants(searchQuery)) || [];
        const combinedPlants = [...firebasePlants, ...apiPlants]
        const uniquePlants = combinedPlants.filter(
          (plant, index, self) =>
            index === self.findIndex((p) => p.id === plant.id || p.name === plant.name)
        );
        setPlants(uniquePlants);
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
