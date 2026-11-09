import { getFirestore, updateDoc } from "@react-native-firebase/firestore";

import { IHousehold, IUserPlant } from "@/constants/IPlant";
import { plantDoc } from "@/helpers/firebase/householdPaths";
import { carersFor } from "@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase";

/**
 * Shares a plant with the whole household, or makes it personal again. A
 * personal plant goes back to whoever added it.
 */
async function setPlantSharing(
  household: Pick<IHousehold, "id" | "memberIds">,
  plant: IUserPlant,
  shared: boolean,
  fallbackOwner: string,
): Promise<IUserPlant> {
  const sharing = {
    shared,
    carerIds: carersFor(shared, plant.addedBy ?? fallbackOwner, household),
  };
  await updateDoc(plantDoc(getFirestore(), household.id, plant.id), sharing);
  return { ...plant, ...sharing };
}

export default setPlantSharing;
