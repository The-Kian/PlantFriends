import { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";

import { IUserPlant, IUserPlantMerged } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import fetchUserPlants from "@/helpers/plants/fetchUserPlants";
import fetchFirebasePlantById from '@/helpers/firebase/fetchFirebasePlantById';
import { setUserPlants } from "@/store/userPlantsSlice";

export interface useUserPlantsProps {
  getPlants: () => Promise<IUserPlant[]>;
}

const useUserPlants = (): useUserPlantsProps => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();

  const getPlants = useCallback(async (): Promise<IUserPlant[]> => {
    if (!user) {
      return [];
    }

    const plants = await fetchUserPlants(user.uid);

    // Attempt to enrich each user plant with its base plant data.
    const merged = await Promise.all(
      plants.map(async (up) => {
        try {
          if (!up.plantId) return up;
          const base = await fetchFirebasePlantById(up.plantId);
          if (!base) return up;
          // Merge base fields into the user plant while preserving user instance id
          const mergedPlant: IUserPlantMerged = {
            // include base fields first, then user fields overwrite when present
            ...base,
            ...up,
            id: up.id,
          };
          return mergedPlant;
        } catch (e) {
          console.error('Error merging plant data:', e);
          return up;
        }
      }),
    );

    dispatch(setUserPlants(merged));
    return plants;
  }, [user, dispatch]);

  return { getPlants };
};

export default useUserPlants;
