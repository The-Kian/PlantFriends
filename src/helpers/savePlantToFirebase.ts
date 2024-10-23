import { IPlant } from "@constants/IPlant";
import firestore from "@react-native-firebase/firestore";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";

import uuid from "react-native-uuid";

const savePlantToFirebase = async (
  customizedPlant: IPlant,
  user: FirebaseAuthTypes.User | null
) => {
  if (!user) {
    console.error("User is not authenticated.");
    return;
  }

  const plantId = uuid.v4().toString();
  
  try {
    await firestore()
      .collection("Users")
      .doc(user.uid)
      .collection("Plants")
      .doc(plantId) 
      .set({...customizedPlant, id: plantId});

    console.log("Plant saved successfully:", customizedPlant);
  } catch (error) {
    console.error("Error adding plant: ", error);
  }
};

export default savePlantToFirebase;
