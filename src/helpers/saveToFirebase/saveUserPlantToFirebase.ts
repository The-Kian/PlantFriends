import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import uuid from "react-native-uuid";

import { IUserPlant } from "@constants/IPlant";

const saveUserPlantToFirebase = async (
    userPlant: IUserPlant,
    user: FirebaseAuthTypes.User
  ) => {

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
  
      console.log("User plant saved successfully:", userPlantData);
    } catch (error) {
      console.error("Error saving user plant data: ", error);
    }
  };

export default saveUserPlantToFirebase;