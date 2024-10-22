import { IPlant } from "@constants/IPlant";
import { useState, useEffect } from "react";
import { mapOpenFarmPlantToIPlant } from "src/helpers/mapOpenFarmPlantToIPlant";
import { mapPerenualPlantToIPlant } from "src/helpers/mapPerenualPlantToIPlant";

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
          console.log(`🚀 ~ fetchPlants ~ plantsData:`, plantsData)
          
          setPlants(plantsData);
        } catch (error: any) {
          setError(error.message);
          console.log(`🚀 ~ fetchPlants ~ error.message:`, error.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchPlants();
    }, [searchQuery]);

  return { plants, loading, error };
};

const fetchOpenFarmPlants = async (searchQuery: string): Promise<IPlant[]> => {
  const URL = `https://openfarm.cc/api/v1/crops/?filter=${searchQuery}`;
  const response = await fetch(URL);
  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {
    const plantsData: IPlant[] = data.data.map((plant: any) =>
      mapOpenFarmPlantToIPlant(plant)
    );
    return plantsData;
  } else {
    throw new Error("No plants found");
  }
};

const fetchPerenualPlants = async (searchQuery: string): Promise<IPlant[]> => {
  const URL = `https://perenual.com/api/species-list?key=${process.env.PERENUAL_API_KEY}&q=${searchQuery}`;
  const response = await fetch(URL);
  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {
    const plantsData: IPlant[] = data.data.map((plant: any) =>
      mapPerenualPlantToIPlant(plant)
    );
    return plantsData;
  } else {
    throw new Error("No plants found");
  }
};
