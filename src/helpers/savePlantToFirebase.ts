import { IPlant, IUserPlant } from "@constants/IPlant";
import firestore from "@react-native-firebase/firestore";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import uuid from "react-native-uuid";

const savePlantToFirebase = async (
  userPlant: IUserPlant,
  plantData: IPlant,
  user: FirebaseAuthTypes.User | null
) => {
  if (!user) {
    console.error("User is not authenticated.");
    return;
  }

  const plantId = plantData.id;
  const plantRef = firestore().collection("Plants").doc(plantId);
  const plantDoc = await plantRef.get();

  // Save the base plant data if it doesn't exist
  if (!plantDoc.exists) {
    try {
      const basePlantData = {
        ...plantData,
        contributed_by: user.displayName ?? user.email,
        isVerified: plantData.isVerified ?? false,
      };
      await plantRef.set(basePlantData);
      console.log("Base plant saved successfully:", basePlantData);
    } catch (error) {
      console.error("Error saving base plant data: ", error);
    }
  }

  // Prepare the user plant data
  const userPlantId = userPlant.id ?? uuid.v4().toString();
  const userPlantData: IUserPlant = {
    ...userPlant,
    id: userPlantId,
    userId: user.uid,
    plantId: plantId,
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

export default savePlantToFirebase;
