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
import { syncAllWateringReminders } from "@/services/NotificationService";
import { setUserPlants } from "@/store/userPlantsSlice";

export interface HouseholdContextType {
  household: IHousehold | null;
  /** True until the household's plants have loaded for the first time. */
  loading: boolean;
  error: string | null;
  /** A member's display name, or null if they aren't in the household. */
  memberName: (uid?: string | null) => string | null;
}

export const HouseholdContext = createContext<HouseholdContextType>({
  household: null,
  loading: true,
  error: null,
  memberName: () => null,
});

export const useHousehold = () => useContext(HouseholdContext);

type BasePlantCache = Map<string, Promise<IPlant | null>>;

// Adds species data (name, images, watering frequency) to each plant. Species
// are cached by ID, so a change to one plant doesn't refetch every species.
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
 * live listener, so changes made on another device show up straight away.
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

  const settingUp = useRef(false);
  const migrating = useRef(false);
  const basePlantCache = useRef<BasePlantCache>(new Map());

  // 1. Follow the user's profile to find their household. Linking housemates
  //    in the console updates householdId here, and the app switches over live.
  useEffect(() => {
    if (!user) {
      setHouseholdId(null);
      setHousehold(null);
      setLoading(true);
      setError(null);
      settingUp.current = false;
      migrating.current = false;
      dispatch(setUserPlants([]));
      return;
    }

    return onSnapshot(
      userDoc(getFirestore(), user.uid),
      (snap) => {
        const profile = (snap?.data() ?? {}) as {
          householdId?: string;
          plantsMigratedAt?: unknown;
        };

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

  // 3. Keep the household's plants in Redux, and this device's reminders in
  //    step with them.
  useEffect(() => {
    if (!householdId || !user) return;

    let latest = 0;

    return onSnapshot(
      plantsCol(getFirestore(), householdId),
      async (snap) => {
        const run = ++latest;
        const plants: IUserPlant[] = (snap?.docs ?? []).map(
          (d: { data: () => unknown }) => d.data() as IUserPlant,
        );

        const merged = await mergeWithBasePlants(
          plants,
          basePlantCache.current,
        );
        if (run !== latest) return; // a newer snapshot has arrived
        dispatch(setUserPlants(merged));
        setError(null);
        setLoading(false);

        // Reminders are still scheduled on this device until the server
        // sends them (phase 5 of the household plan). Only for plants this
        // person looks after, not a housemate's own plants.
        const mine = plants.filter(
          (p) => !p.carerIds || p.carerIds.includes(user.uid),
        );
        syncAllWateringReminders(mine).catch((e) =>
          console.warn("syncAllWateringReminders failed:", e),
        );
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
      memberName: (uid) =>
        (uid && household?.members?.[uid]?.displayName) || null,
    }),
    [household, loading, error],
  );

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};
