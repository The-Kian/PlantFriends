import { useCallback, useContext } from "react";
import getUserPlantData from "@helpers/getUserPlantData";
import { IUserPlant } from "@constants/IPlant";

import { useDispatch } from "react-redux";
import { setUserPlants } from "@store/userPlantsSlice";
import { AuthContext } from "@context/auth/AuthProvider";
import fetchUserPlants from "@helpers/fetchUserPlants";

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
    dispatch(setUserPlants(plants));
    return plants;
  }, [user, dispatch]);

  return { getPlants };
};

export default useUserPlants;
