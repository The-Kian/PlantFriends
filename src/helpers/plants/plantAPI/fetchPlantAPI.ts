/* eslint-disable import/no-unresolved */

import { PERENUAL_API_KEY } from "@env";

import { IPlant } from "@/constants/IPlant";

import { mapPerenualPlantToIPlant, PerenualPlant } from "./mapPerenualPlantToIPlant";

interface PerenualAPIResponse {
  data: PerenualPlant[];
}

export const fetchPerenualPlants = async (
  searchQuery: string,
): Promise<IPlant[]> => {
  try {
    const URL = `https://perenual.com/api/species-list?key=${PERENUAL_API_KEY}&q=${searchQuery}`;
    const response = await fetch(URL);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: PerenualAPIResponse = await response.json();

    if (data.data && Array.isArray(data.data)) {
      const plantsData: IPlant[] = data.data.map((plant: PerenualPlant) => {
        const mapped = mapPerenualPlantToIPlant(plant);
        return mapped;
      });
      return plantsData;
    } else {
      throw new Error("No plants found in API response");
    }
  } catch (error) {
    console.error("Error fetching Perenual plants:", error);
    throw error;
  }
};
