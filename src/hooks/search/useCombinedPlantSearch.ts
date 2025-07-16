import { useState, useEffect } from "react";
import fetchFirebasePlants from "@helpers/fetchFirebasePlants";
import { fetchPerenualPlants } from "@helpers/plantAPI/fetchPlantAPI";
import { IPlant } from "@constants/IPlant";

export const useCombinedPlantSearch = (searchQuery: string) => {
  const [plants, setPlants] = useState<IPlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (searchQuery.length === 0) {
      setPlants([]);
      return;
    }

    const fetchPlants = async () => {
      setLoading(true);
      setError(null);
      try {
        const firebasePlants = await fetchFirebasePlants(searchQuery) || [];
        console.log(`🚀 - KP -  ~ fetchPlants ~ firebasePlants:`, firebasePlants)
        
        const apiPlants = await fetchPerenualPlants(searchQuery) || [];
        console.log(`🚀 - KP -  ~ fetchPlants ~ apiPlants:`, apiPlants)

        // Combine and deduplicate plants based on `id` or `name`
        const combinedPlants = [...firebasePlants, ...apiPlants];
        const uniquePlants = combinedPlants.filter(
          (plant, index, self) =>
            index === self.findIndex((p) => p.id === plant.id || p.name === plant.name)
        );
        console.log(`🚀 - KP -  ~ fetchPlants ~ uniquePlants:`, uniquePlants)

        setPlants(uniquePlants);
      } catch (err) {
        setError(err as Error);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, [searchQuery]);

  console.log(`🚀 - KP -  ~ useCombinedPlantSearch ~ plants:`, plants)
  return { plants, loading, error };
};