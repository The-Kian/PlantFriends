import { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { IUserPlant, IPlant } from "@/constants/IPlant";
import removeUserPlantFromFirebase from "@/helpers/firebase/removeUserPlantFromFirebase";
import savePlantToFirebase from "@/helpers/firebase/savePlantToFirebase";
import saveUserPlantToFirebase from "@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase";

const usePlantPersistence = (user: FirebaseAuthTypes.User | null) => {

  const persistSavePlant = async (
    userPlant: IUserPlant,
    plant: IPlant,
  ): Promise<IUserPlant | null> => {
    if (!user) return null;
    const result = await savePlantToFirebase(userPlant, plant, user);
    return result ?? null;
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
