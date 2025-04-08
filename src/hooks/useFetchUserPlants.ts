import { useCallback, useContext } from "react";
import getUserPlantData from "@helpers/getUserPlantData";
import { IUserPlant } from "@constants/IPlant";

import { useDispatch } from "react-redux";
import { setUserPlants } from "@store/userPlantsSlice";
import { AuthContext } from "@context/auth/AuthProvider";
import getUserPlants from "@helpers/getUserPlants";

export interface UseFetchPlantsProps {
  getPlants: () => Promise<IUserPlant[]>;
}

const useFetchPlants = (): UseFetchPlantsProps => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();

  const getPlants = useCallback(async (): Promise<IUserPlant[]> => {
    if (!user) {
      return [];
    }

    const plants = await getUserPlants(user.uid);
    dispatch(setUserPlants(plants));
    return plants;
  }, [user, dispatch]);

  return { getPlants };
};

export default useFetchPlants;
