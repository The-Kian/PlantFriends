import { FirebaseAuthTypes } from "@react-native-firebase/auth";

import savePlantToFirebase from "@/helpers/savePlantToFirebase";
import removeUserPlantFromFirebase from "@/helpers/removeUserPlantFromFirebase";
import saveUserPlantToFirebase from "@/helpers/saveToFirebase/saveUserPlantToFirebase";
import { IUserPlant, IPlant } from "@/constants/IPlant";

const usePlantPersistence = (user: FirebaseAuthTypes.User | null) => {

  const persistSavePlant = async (
    userPlant: IUserPlant,
    plant: IPlant,
  ): Promise<IUserPlant | null> => {
    if (!user) return null;
    return await savePlantToFirebase(userPlant, plant, user);
  };

  const persistDeletePlant = async (userPlantId: string): Promise<boolean> => {
    if (!user) return false;
    return await removeUserPlantFromFirebase(userPlantId, user);
  };

  const persistUpdatePlant = async (userPlant: IUserPlant): Promise<boolean> => {
    if (!user) return false;
    return await saveUserPlantToFirebase(userPlant, user);
  };

  return {
    persistSavePlant,
    persistDeletePlant,
    persistUpdatePlant,
  };
};

export default usePlantPersistence;
