import { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { IUserPlant, IPlant } from "@/constants/IPlant";
import removeUserPlantFromFirebase from "@/helpers/firebase/removeUserPlantFromFirebase";
import savePlantToFirebase from "@/helpers/firebase/savePlantToFirebase";
import saveUserPlantToFirebase from "@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase";

const usePlantPersistence = (user: FirebaseAuthTypes.User | null) => {

  const persistSavePlant = async (
    userPlant: IUserPlant,
    plant: IPlant,
  ): Promise<IUserPlant | undefined> => {
    if (!user) return undefined;
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
