
import { useState, useContext } from "react";

import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
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

  const handleSaveToFirebase = async (
    updatedUserPlant: IUserPlant,
    plantData: IPlant
  ) => {
    const savedPlant = await savePlantToFirebase(updatedUserPlant, plantData, user);
    if (savedPlant) {
      setUserPlant(savedPlant);
    }
    setSelectedPlant(null);
  };

  return {
    selectedPlant,
    userPlant,
    handleSelectPlant,
    handleSaveToFirebase,
    closeModal: () => setSelectedPlant(null),
  };
}
export default usePlantSelection;
