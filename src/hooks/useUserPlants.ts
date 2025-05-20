import { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";

import { IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import fetchUserPlants from "@helpers/fetchUserPlants";
import { setUserPlants } from "@store/userPlantsSlice";

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
