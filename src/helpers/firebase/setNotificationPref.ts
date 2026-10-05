import { getFirestore, setDoc } from "@react-native-firebase/firestore";

import { INotificationPrefs } from "@/constants/IPlant";
import { userDoc } from "@/helpers/firebase/householdPaths";

/** Turns one kind of push on or off for this user, on every device. */
async function setNotificationPref(
  uid: string,
  key: keyof INotificationPrefs,
  value: boolean,
): Promise<void> {
  await setDoc(
    userDoc(getFirestore(), uid),
    { notificationPrefs: { [key]: value } },
    { merge: true },
  );
}

export default setNotificationPref;
