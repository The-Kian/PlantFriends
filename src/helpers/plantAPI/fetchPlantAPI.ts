/* eslint-disable @typescript-eslint/no-explicit-any */
import { IPlant } from "@constants/IPlant";

import { PERENUAL_API_KEY } from "@env";


import { mapOpenFarmPlantToIPlant } from "./mapOpenFarmPlantToIPlant";
import { mapPerenualPlantToIPlant } from "./mapPerenualPlantToIPlant";

export const fetchOpenFarmPlants = async (searchQuery: string): Promise<IPlant[]> => {
    const URL = `https://openfarm.cc/api/v1/crops/?filter=${searchQuery}`;
    const response = await fetch(URL);
    console.log(`🚀 - KP -  ~ fetchOpenFarmPlants ~ response:`, response)
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
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
    const URL = `https://perenual.com/api/species-list?key=${PERENUAL_API_KEY}&q=${searchQuery}`;
    console.log(`🚀 - KP -  ~ fetchPerenualPlants ~ URL:`, URL)
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    console.log(`🚀 - KP -  ~ fetchPerenualPlants ~ data:`, data)

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
  