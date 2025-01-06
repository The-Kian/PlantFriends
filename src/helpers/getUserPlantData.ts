import { IUserPlant } from "@constants/IPlant";
import firestore from "@react-native-firebase/firestore";

async function getUserPlantData(
    userId: string,
    plantId: string
  ): Promise<IUserPlant | undefined> {
    const userPlantsRef = firestore()
      .collection("Users")
      .doc(userId)
      .collection("UserPlants")
      .where("plantId", "==", plantId);
  
    const snapshot = await userPlantsRef.get();
  
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as IUserPlant;
    }
    return undefined;
  }
  

  export default getUserPlantData;