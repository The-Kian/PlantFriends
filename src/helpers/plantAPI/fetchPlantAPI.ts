import { IPlant } from "@constants/IPlant";

import { mapOpenFarmPlantToIPlant } from "./mapOpenFarmPlantToIPlant";
import { mapPerenualPlantToIPlant } from "./mapPerenualPlantToIPlant";

export const fetchOpenFarmPlants = async (searchQuery: string): Promise<IPlant[]> => {
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
  
  export const fetchPerenualPlants = async (searchQuery: string): Promise<IPlant[]> => {
    try {
    const URL = `https://perenual.com/api/species-list?key=${process.env.PERENUAL_API_KEY}&q=${searchQuery}`;
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      const plantsData: IPlant[] = data.data.map((plant: any) =>
        mapPerenualPlantToIPlant(plant)
      );
      return plantsData;
    } else {
      throw new Error("No plants found in API response");
    }
  } catch (error) {
    console.error("Error fetching Perenual plants:", error);
    throw error; // Re-throw to be caught by calling function
  }
};
  