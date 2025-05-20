import { useContext } from "react";
import { useDispatch } from "react-redux";

import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import savePlantToFirebase from "@helpers/savePlantToFirebase";
import { addPlant, deletePlant, updatePlant } from "@store/userPlantsSlice";

export interface DataHandlersProps {
  handlePlantSubmit: (userPlant: IUserPlant, plant: IPlant) => void;
  handleDeletePlant: (plant: IPlant) => void;
  handleUpdatePlant: (plant: IUserPlant) => void;
}

export const useUserPlantDataHandlers = (): DataHandlersProps => {
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext);

  const handlePlantSubmit = async (userPlant: IUserPlant, plant: IPlant) => {
    try {
      if (user) {
        // console.log(`🚀 - KP -  ~ handlePlantSubmit ~ Starting plant submission in handler:`, user)
        const savedPlant = await savePlantToFirebase(userPlant, plant, user);
        // console.log(`🚀 - KP -  ~ handlePlantSubmit ~ Firebase save complete`, user)
        if (savedPlant) {
          // console.log(`🚀 - KP -  ~ handlePlantSubmit ~ Dispatching addPlant action:`)
          dispatch(addPlant(savedPlant));
          // console.log(`🚀 - KP -  ~ handlePlantSubmit ~ Dispatching addPlant action complete`)
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Error submitting plant data:", error);
      return false
    }
  };

  const handleDeletePlant = async (plant: IPlant) => {
    try {
      if (user) {
        // await deletePlantFromFirebase(plant, user);
      }
      dispatch(deletePlant(plant.id));
    } catch (error) {
      console.error("Error deleting plant data:", error);
    }
  };

  const handleUpdatePlant = async (plant: IUserPlant) => {
    try {
      if (user) {
        // await updatePlantInFirebase(plant, user);
      }
      dispatch(updatePlant(plant));
    } catch (error) {
      console.error("Error updating plant data:", error);
    }
  };

  return { handlePlantSubmit, handleDeletePlant, handleUpdatePlant };
};
