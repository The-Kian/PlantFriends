import { IUserPlant, IPlant } from "@constants/IPlant";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import saveBasePlantToFirebase from "./saveToFirebase/saveBasePlantToFirebase";
import saveUserPlantToFirebase from "./saveToFirebase/saveUserPlantToFirebase";

const savePlantToFirebase = async (
  userPlant: IUserPlant,
  plantData: IPlant,
  user: FirebaseAuthTypes.User | null
) => {
  if (!user) {
    console.error("User is not authenticated.");
    return;
  }

  await saveBasePlantToFirebase(plantData, user);
  await saveUserPlantToFirebase(userPlant, user);
};

export default savePlantToFirebase;