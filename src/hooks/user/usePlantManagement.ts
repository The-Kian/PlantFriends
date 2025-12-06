import { useState, useContext } from "react";
import { useDispatch } from "react-redux";

import uuid from "react-native-uuid";

import { IPlant, IUserPlant } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import getUserPlantData from "@/helpers/getUserPlantData";
import { addPlant, deletePlant, updatePlant } from "@/store/userPlantsSlice";
import usePlantPersistence from "@/hooks/user/usePlantPersistence";
import usePlantCustomizations from "@/hooks/user/usePlantCustomizations";

export const usePlantManagement = () => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();

  // Selection / fetched user plant
  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);
  const [userPlant, setUserPlant] = useState<IUserPlant | null>(null);

  const { customizations, handlePlantAttributeChange } =
    usePlantCustomizations();

  const { persistSavePlant, persistDeletePlant, persistUpdatePlant } =
    usePlantPersistence(user);

  const handleSelectPlant = async (plant: IPlant) => {
    setSelectedPlant(plant);
    if (user) {
      const userPlantData = await getUserPlantData(user.uid, plant.id);
      setUserPlant(userPlantData || null);
    }
  };

  const handleUserDataChange = <K extends keyof IUserPlant>(
    field: K,
    value: IUserPlant[K],
  ) => {
    setUserPlant((prevUserData) => {
      const updatedUserData = prevUserData || {
        id: uuid.v4().toString(), // Initialize if null
        userId: user?.uid || "",
        plantId: selectedPlant?.id || "",
        custom_attributes: {},
      };

      return {
        ...updatedUserData,
        [field]: value,
      };
    });
  };

  const handleSavePlant = async (
    updatedUserPlant: IUserPlant,
    plant: IPlant,
  ) => {
    try {
      const savedPlant = await persistSavePlant(updatedUserPlant, plant);
      if (savedPlant) {
        dispatch(addPlant(savedPlant));
        setUserPlant(savedPlant);
        setSelectedPlant(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving plant:", error);
      return false;
    }
  };

  const handleDeletePlant = async (plant: IUserPlant) => {
    try {
      // Optimistic removal for immediate UI response
      dispatch(deletePlant(plant.id));

      // Fire-and-forget backend removal; log failures for troubleshooting
      persistDeletePlant(plant.id).then((removed) => {
        if (!removed) {
          console.error("Failed to remove plant from firebase");
        }
      });

      return true;
    } catch (error) {
      console.error("Error deleting plant:", error);
    }
  };

  const handleUpdatePlant = async (updatedPlant: IUserPlant) => {
    try {
      if (user) {
        dispatch(updatePlant(updatedPlant));
      }
    } catch (error) {
      console.error("Error updating plant:", error);
    }
  };

  return {
    selectedPlant,
    userPlant,
    customizations,
    handleSelectPlant,
    handlePlantAttributeChange,
    handleUserDataChange,
    handleSavePlant,
    handleDeletePlant,
    handleUpdatePlant,
  };
};
