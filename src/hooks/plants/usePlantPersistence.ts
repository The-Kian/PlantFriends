import { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { IHousehold, IUserPlant, IPlant } from "@/constants/IPlant";
import removeUserPlantFromFirebase from "@/helpers/firebase/removeUserPlantFromFirebase";
import savePlantToFirebase from "@/helpers/firebase/savePlantToFirebase";
import saveUserPlantToFirebase from "@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase";

const usePlantPersistence = (
  user: FirebaseAuthTypes.User | null,
  household: IHousehold | null,
) => {

  const persistSavePlant = async (
    userPlant: IUserPlant,
    plant: IPlant,
  ): Promise<IUserPlant | null> => {
    if (!user || !household) return null;
    const result = await savePlantToFirebase(userPlant, plant, user, household);
    return result ?? null;
  };

  const persistDeletePlant = async (userPlantId: string): Promise<boolean> => {
    if (!user || !household) return false;
    return await removeUserPlantFromFirebase(userPlantId, user, household.id);
  };

  const persistUpdatePlant = async (userPlant: IUserPlant): Promise<boolean> => {
    if (!user || !household) return false;
    return await saveUserPlantToFirebase(userPlant, user, household);
  };

  return {
    persistSavePlant,
    persistDeletePlant,
    persistUpdatePlant,
  };
};

export default usePlantPersistence;
