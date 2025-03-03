import uuid from "react-native-uuid";

import { IUserPlant } from "@constants/IPlant";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const saveUserPlantToFirebase = async (
  userPlant: IUserPlant,
  user: FirebaseAuthTypes.User
): Promise<boolean> => {
  const userPlantId = userPlant.id ?? uuid.v4().toString();
  const userPlantData: IUserPlant = {
    ...userPlant,
    id: userPlantId,
    userId: user.uid,
    plantId: userPlant.plantId,
  };

  try {
    await firestore()
      .collection("Users")
      .doc(user.uid)
      .collection("UserPlants")
      .doc(userPlantId)
      .set(userPlantData);
    return true;
  } catch (error) {
    console.error("Error saving user plant data: ", error);
    return false;
  }
};

export default saveUserPlantToFirebase;