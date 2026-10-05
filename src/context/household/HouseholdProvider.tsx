import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { getFirestore, onSnapshot } from "@react-native-firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { ProviderProps } from "@/constants/genericTypes";
import {
  IHousehold,
  INotificationPrefs,
  IPlant,
  IUserPlant,
  IUserPlantMerged,
} from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import fetchFirebasePlantById from "@/helpers/firebase/fetchFirebasePlantById";
import {
  householdDoc,
  plantsCol,
  userDoc,
} from "@/helpers/firebase/householdPaths";
import {
  createSoloHousehold,
  migrateUserPlants,
} from "@/helpers/household/setupHousehold";
import { dismissPlantNotifications } from "@/services/NotificationService";
import { registerForPush } from "@/services/PushRegistration";
import { setUserPlants } from "@/store/userPlantsSlice";

export interface HouseholdContextType {
  household: IHousehold | null;
  /** True until the household's plants have loaded for the first time. */
  loading: boolean;
  error: string | null;
  notificationPrefs: INotificationPrefs;
  /** A member's display name, or null if they aren't in the household. */
  memberName: (uid?: string | null) => string | null;
}

export const HouseholdContext = createContext<HouseholdContextType>({
  household: null,
  loading: true,
  error: null,
  notificationPrefs: {},
  memberName: () => null,
});

export const useHousehold = () => useContext(HouseholdContext);

type BasePlantCache = Map<string, Promise<IPlant | null>>;

// Adds species data (name, images, watering frequency) to each plant. Species
// are cached by ID, so a watering doesn't refetch every plant's species.
async function mergeWithBasePlants(
  plants: IUserPlant[],
  cache: BasePlantCache,
): Promise<(IUserPlant | IUserPlantMerged)[]> {
  return Promise.all(
    plants.map(async (up) => {
      if (!up.plantId) return up;
      try {
        if (!cache.has(up.plantId)) {
          cache.set(up.plantId, fetchFirebasePlantById(up.plantId));
        }
        const base = await cache.get(up.plantId);
        if (!base) return up;
        // Base fields first, then the user's own fields win.
        return { ...base, ...up, id: up.id } as IUserPlantMerged;
      } catch (e) {
        console.error("Error merging plant data:", e);
        return up;
      }
    }),
  );
}

/**
 * Loads the signed-in user's household and keeps its plants in Redux with a
 * live listener, so a housemate's watering shows up straight away.
 *
 * On first load it creates a household of the user's own if they have none,
 * and copies over plants from older builds.
 */
export const HouseholdProvider = ({ children }: ProviderProps) => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [household, setHousehold] = useState<IHousehold | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] =
    useState<INotificationPrefs>({});

  const settingUp = useRef(false);
  const migrating = useRef(false);
  const basePlantCache = useRef<BasePlantCache>(new Map());

  // 1. Follow the user's profile: which household they're in, and their
  //    notification switches. Linking housemates in the console updates
  //    householdId here, and the app switches over live.
  useEffect(() => {
    if (!user) {
      setHouseholdId(null);
      setHousehold(null);
      setNotificationPrefs({});
      setLoading(true);
      setError(null);
      settingUp.current = false;
      migrating.current = false;
      dispatch(setUserPlants([]));
      return;
    }

    registerForPush(user.uid, { prompt: false });

    return onSnapshot(
      userDoc(getFirestore(), user.uid),
      (snap) => {
        const profile = (snap?.data() ?? {}) as {
          householdId?: string;
          plantsMigratedAt?: unknown;
          notificationPrefs?: INotificationPrefs;
        };
        setNotificationPrefs(profile.notificationPrefs ?? {});

        if (!profile.householdId) {
          setUpHousehold(user);
          return;
        }
        setHouseholdId(profile.householdId);

        if (!profile.plantsMigratedAt && !migrating.current) {
          migrating.current = true;
          migrateUserPlants(user, profile.householdId).catch((e) => {
            migrating.current = false;
            console.warn("migrateUserPlants failed:", e);
          });
        }
      },
      (e) => {
        console.warn("Profile listener failed:", e);
        setError("Couldn't load your household. Please try again.");
        setLoading(false);
      },
    );

    function setUpHousehold(signedIn: FirebaseAuthTypes.User) {
      if (settingUp.current) return;
      settingUp.current = true;
      createSoloHousehold(signedIn).catch((e) => {
        settingUp.current = false;
        console.warn("createSoloHousehold failed:", e);
        setError("Couldn't set up your household. Please try again.");
        setLoading(false);
      });
    }
  }, [user, dispatch]);

  // 2. Follow the household itself (name and members).
  useEffect(() => {
    if (!householdId) return;
    return onSnapshot(
      householdDoc(getFirestore(), householdId),
      (snap) => {
        const data = snap?.data();
        setHousehold(data ? ({ ...data, id: householdId } as IHousehold) : null);
      },
      (e) => console.warn("Household listener failed:", e),
    );
  }, [householdId]);

  // 3. Keep the household's plants in Redux.
  useEffect(() => {
    if (!householdId || !user) return;

    const lastWatered = new Map<string, number | null | undefined>();
    let latest = 0;

    return onSnapshot(
      plantsCol(getFirestore(), householdId),
      async (snap) => {
        const run = ++latest;
        const plants = (snap?.docs ?? []).map(
          (d: { data: () => unknown }) => d.data() as IUserPlant,
        );

        // A plant that was just watered, or isn't due any more, has no use
        // for a "needs watering" reminder still sitting in the tray.
        const stale: string[] = [];
        for (const plant of plants) {
          const changed = lastWatered.get(plant.id) !== plant.last_watered_date;
          lastWatered.set(plant.id, plant.last_watered_date);
          const notDue =
            !plant.next_watering_date || plant.next_watering_date > Date.now();
          if (changed && notDue) {
            stale.push(plant.id);
          }
        }
        dismissPlantNotifications(stale);

        const merged = await mergeWithBasePlants(
          plants,
          basePlantCache.current,
        );
        if (run !== latest) return; // a newer snapshot has arrived
        dispatch(setUserPlants(merged));
        setError(null);
        setLoading(false);
      },
      (e) => {
        console.warn("Plants listener failed:", e);
        setError("Failed to load your plants. Please try again.");
        setLoading(false);
      },
    );
  }, [householdId, user, dispatch]);

  const value = useMemo<HouseholdContextType>(
    () => ({
      household,
      loading,
      error,
      notificationPrefs,
      memberName: (uid) =>
        (uid && household?.members?.[uid]?.displayName) || null,
    }),
    [household, loading, error, notificationPrefs],
  );

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};
