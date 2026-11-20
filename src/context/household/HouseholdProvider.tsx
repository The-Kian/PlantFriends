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
import { errorCode } from "@/helpers/errors/friendlyErrors";
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
import { recordHandledError } from "@/services/CrashReporting";
import { dismissStaleReminders } from "@/services/NotificationService";
import { registerForPush } from "@/services/PushRegistration";
import { setUserPlants } from "@/store/userPlantsSlice";

export interface HouseholdContextType {
  household: IHousehold | null;
  /** True until the household's plants have loaded for the first time. */
  loading: boolean;
  error: string | null;
  /** The signed-in user's notification switches. */
  notificationPrefs: INotificationPrefs;
  /** A member's display name, or null if they aren't in the household. */
  memberName: (uid?: string | null) => string | null;
  /** Tries setting up or loading the household again after an error. */
  retry: () => void;
}

export const HouseholdContext = createContext<HouseholdContextType>({
  household: null,
  loading: true,
  error: null,
  notificationPrefs: {},
  memberName: () => null,
  retry: () => {},
});

export const useHousehold = () => useContext(HouseholdContext);

type BasePlantCache = Map<string, Promise<IPlant | null>>;

// A species that couldn't be fetched (offline) is tried again this often, a
// few times, rather than staying blank until the app restarts.
const SPECIES_RETRY_MS = 20_000;
const SPECIES_RETRY_LIMIT = 5;
// After losing access to a household (leaving, being removed), the listener
// for it fails before the profile points at the new one. Wait this long
// before treating that as a real problem.
const ACCESS_LOST_GRACE_MS = 5_000;

// Adds species data (name, images, watering frequency) to each plant. Species
// are cached by ID, so a change to one plant doesn't refetch every species.
// A failed fetch is dropped from the cache, so the next call retries it, and
// reported in `failed`.
async function mergeWithBasePlants(
  plants: IUserPlant[],
  cache: BasePlantCache,
): Promise<{ merged: (IUserPlant | IUserPlantMerged)[]; failed: boolean }> {
  let failed = false;
  const merged = await Promise.all(
    plants.map(async (up) => {
      if (!up.plantId) return up;
      const id = up.plantId;
      try {
        if (!cache.has(id)) {
          const pending = fetchFirebasePlantById(id);
          cache.set(id, pending);
          pending.catch(() => cache.delete(id));
        }
        const base = await cache.get(id);
        if (!base) return up;
        // Base fields first, then the user's own fields win.
        return { ...base, ...up, id: up.id } as IUserPlantMerged;
      } catch {
        failed = true;
        return up;
      }
    }),
  );
  return { merged, failed };
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
  const [notificationPrefs, setNotificationPrefs] =
    useState<INotificationPrefs>({});

  const settingUp = useRef(false);
  const migrating = useRef(false);
  const basePlantCache = useRef<BasePlantCache>(new Map());
  // The household the profile points at now, for telling an expected
  // "access lost" listener error from a real one.
  const profileHouseholdId = useRef<string | null>(null);
  // Bumped by retry() to run the set-up again.
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    settingUp.current = false;
    migrating.current = false;
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  /**
   * A listener failed. If it's permission-denied for a household the profile
   * no longer points at, that's what leaving or being removed looks like for
   * a moment: not an error. Otherwise report it.
   */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onListenerError = (
    label: string,
    forHouseholdId: string,
    e: unknown,
    userMessage: string | null,
  ) => {
    const report = () => {
      console.warn(`${label} failed:`, e);
      recordHandledError(e, label);
      if (userMessage) {
        setError(userMessage);
        setLoading(false);
      }
    };
    if (errorCode(e) !== "permission-denied") return report();
    if (profileHouseholdId.current !== forHouseholdId) return;
    timers.current.push(
      setTimeout(() => {
        if (profileHouseholdId.current === forHouseholdId) report();
      }, ACCESS_LOST_GRACE_MS),
    );
  };
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  // 1. Follow the user's profile to find their household. Joining a household
  //    (the joinHousehold function) updates householdId here, and the app
  //    switches over live.
  useEffect(() => {
    if (!user) {
      setHouseholdId(null);
      setHousehold(null);
      setLoading(true);
      setError(null);
      setNotificationPrefs({});
      settingUp.current = false;
      migrating.current = false;
      profileHouseholdId.current = null;
      dispatch(setUserPlants([]));
      return;
    }

    // Registers this device if notifications are already allowed. Asking
    // happens later, after adding or watering a plant.
    registerForPush(user.uid, { prompt: false });

    return onSnapshot(
      userDoc(getFirestore(), user.uid),
      (snap) => {
        const profile = (snap?.data() ?? {}) as {
          householdId?: string;
          plantsMigratedAt?: unknown;
          notificationPrefs?: INotificationPrefs;
          displayName?: string;
        };
        setNotificationPrefs(profile.notificationPrefs ?? {});
        profileHouseholdId.current = profile.householdId ?? null;

        if (!profile.householdId) {
          setUpHousehold(user, profile.displayName);
          return;
        }
        setHouseholdId(profile.householdId);

        if (!profile.plantsMigratedAt && !migrating.current) {
          migrating.current = true;
          migrateUserPlants(user, profile.householdId).catch((e) => {
            migrating.current = false;
            console.warn("migrateUserPlants failed:", e);
            recordHandledError(e, "Migrate plants");
          });
        }
      },
      (e) => {
        console.warn("Profile listener failed:", e);
        recordHandledError(e, "Profile listener");
        setError("Couldn't load your household. Please try again.");
        setLoading(false);
      },
    );

    function setUpHousehold(
      signedIn: FirebaseAuthTypes.User,
      profileName?: string,
    ) {
      if (settingUp.current) return;
      settingUp.current = true;
      createSoloHousehold(signedIn, profileName).catch((e) => {
        settingUp.current = false;
        console.warn("createSoloHousehold failed:", e);
        recordHandledError(e, "Create household");
        setError("Couldn't set up your household. Please try again.");
        setLoading(false);
      });
    }
  }, [user, dispatch, attempt]);

  // 2. Follow the household itself (name and members).
  useEffect(() => {
    if (!householdId) return;
    return onSnapshot(
      householdDoc(getFirestore(), householdId),
      (snap) => {
        const data = snap?.data();
        setHousehold(data ? ({ ...data, id: householdId } as IHousehold) : null);
      },
      (e) => onListenerError("Household listener", householdId, e, null),
    );
  }, [householdId]);

  // 3. Keep the household's plants in Redux, and clear reminders for plants
  //    someone has since watered.
  useEffect(() => {
    if (!householdId || !user) return;

    let latest = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = onSnapshot(
      plantsCol(getFirestore(), householdId),
      async (snap) => {
        const run = ++latest;
        if (retryTimer) clearTimeout(retryTimer);
        const plants: IUserPlant[] = (snap?.docs ?? []).map(
          (d: { data: () => unknown }) => d.data() as IUserPlant,
        );

        // Species that couldn't be fetched (offline) are retried a few times.
        let attempts = 0;
        const show = async () => {
          const { merged, failed } = await mergeWithBasePlants(
            plants,
            basePlantCache.current,
          );
          if (run !== latest) return; // a newer snapshot has arrived
          dispatch(setUserPlants(merged));
          setError(null);
          setLoading(false);
          if (failed && attempts++ < SPECIES_RETRY_LIMIT) {
            retryTimer = setTimeout(show, SPECIES_RETRY_MS);
          }
        };
        await show();
        if (run !== latest) return;

        // Reminders come from the server. Once a plant is watered, on this
        // phone or a housemate's, its reminder here is out of date.
        dismissStaleReminders(plants);
      },
      (e) =>
        onListenerError(
          "Plants listener",
          householdId,
          e,
          "Failed to load your plants. Please try again.",
        ),
    );
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribe();
    };
  }, [householdId, user, dispatch]);

  const value = useMemo<HouseholdContextType>(
    () => ({
      household,
      loading,
      error,
      notificationPrefs,
      memberName: (uid) =>
        (uid && household?.members?.[uid]?.displayName) || null,
      retry,
    }),
    // retry only touches refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [household, loading, error, notificationPrefs],
  );

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};
