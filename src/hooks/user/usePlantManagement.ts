import { useState, useContext } from "react";
import { useDispatch } from "react-redux";

import uuid from "react-native-uuid";

import { IPlant, IUserPlant } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import getUserPlantData from "@/helpers/getUserPlantData";
import savePlantToFirebase from "@/helpers/savePlantToFirebase";
import { addPlant, deletePlant, updatePlant } from "@/store/userPlantsSlice";

export const usePlantManagement = () => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();

  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);
  const [userPlant, setUserPlant] = useState<IUserPlant | null>(null);
  const [customizations, setCustomizations] = useState({});

  const handleSelectPlant = async (plant: IPlant) => {
    setSelectedPlant(plant);
    if (user) {
      const userPlantData = await getUserPlantData(user.uid, plant.id);
      setUserPlant(userPlantData || null);
    }
  };

  const handlePlantAttributeChange = <K extends keyof IPlant>(
    field: K,
    value: IPlant[K],
  ) => {
    setCustomizations((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      if (user) {
        const savedPlant = await savePlantToFirebase(
          updatedUserPlant,
          plant,
          user,
        );
        if (savedPlant) {
          dispatch(addPlant(savedPlant));
          setUserPlant(savedPlant);
          setSelectedPlant(null);
          return true;
        }
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error saving plant:", error);
      return false;
    }
  };

  const handleDeletePlant = async (plant: IUserPlant) => {
    try {
      dispatch(deletePlant(plant.id));
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
