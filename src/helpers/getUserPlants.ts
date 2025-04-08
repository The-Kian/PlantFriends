import firestore from "@react-native-firebase/firestore";
import { IUserPlant } from "@constants/IPlant";

async function getUserPlants(userId: string): Promise<IUserPlant[]> {
  const userPlantsRef = firestore()
    .collection("Users")
    .doc(userId)
    .collection("UserPlants");

  const snapshot = await userPlantsRef.get();

  if (!snapshot.empty) {
    return snapshot.docs.map((doc) => doc.data() as IUserPlant);
  }
  return [];
}

export default getUserPlants;
