
import { useState, useContext } from "react";

import { AuthContext } from "@context/auth/AuthProvider";

import { IPlant, IUserPlant } from "@constants/IPlant";

import getUserPlantData from "@helpers/getUserPlantData";
import savePlantToFirebase from "@helpers/savePlantToFirebase";


// usePlantSelection.ts
function usePlantSelection() {
  const [selectedPlant, setSelectedPlant] = useState<IPlant | null>(null);
  const [userPlant, setUserPlant] = useState<IUserPlant | undefined>(undefined);
  const { user } = useContext(AuthContext);

  const handleSelectPlant = async (plant: IPlant) => {
    setSelectedPlant(plant);
    if (user) {
      const userPlantData = await getUserPlantData(user.uid, plant.id);
      setUserPlant(userPlantData);
    }
  };

  const handleSave = async (
    updatedUserPlant: IUserPlant,
    plantData: IPlant
  ) => {
    await savePlantToFirebase(updatedUserPlant, plantData, user);
    setSelectedPlant(null);
  };

  return {
    selectedPlant,
    userPlant,
    handleSelectPlant,
    handleSave,
    closeModal: () => setSelectedPlant(null),
  };
}
export default usePlantSelection;
