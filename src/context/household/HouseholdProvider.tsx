import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { getFirestore, onSnapshot } from "@react-native-firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { StyleSheet } from "react-native";

import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { ThemedView } from "@/components/ui/Views/ThemedView";
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
import { subscribeToMembershipChange } from "@/helpers/household/membershipChange";
import {
  createSoloHousehold,
  migrateUserPlants,
} from "@/helpers/household/setupHousehold";
import { recordHandledError } from "@/services/CrashReporting";
import { dismissStaleReminders } from "@/services/NotificationService";
import { registerForPush } from "@/services/PushRegistration";
import { setUserPlants } from "@/store/userPlantsSlice";
import { Spacing } from "@/theme/Spacing";

export interface HouseholdContextType {
  household: IHousehold | null;
  /** True until the household's plants have loaded for the first time. */
  loading: boolean;
  error: string | null;
  /**
   * Set when creating the user's household failed. The provider shows a "Try
   * again" screen for it; `retrySetup` is what that button calls.
   */
  setupError?: string | null;
  retrySetup?: () => void;
  /** The signed-in user's notification switches. */
  notificationPrefs: INotificationPrefs;
  /** A member's display name, or null if they aren't in the household. */
  memberName: (uid?: string | null) => string | null;
}

export const HouseholdContext = createContext<HouseholdContextType>({
  household: null,
  loading: true,
  error: null,
  setupError: null,
  retrySetup: () => {},
  notificationPrefs: {},
  memberName: () => null,
});

export const useHousehold = () => useContext(HouseholdContext);

type BasePlantCache = Map<string, Promise<IPlant | null>>;

/** How long to wait before trying species that failed to load again. */
export const SPECIES_RETRY_MS = 20_000;
/** How long a permission error may last before it's treated as real. */
export const PERMISSION_GRACE_MS = 3_000;
/** The longest to stay quiet after a join or leave, if nothing changes. */
export const MEMBERSHIP_CHANGE_MAX_MS = 10_000;

function isPermissionDenied(error: unknown): boolean {
  const { code, message } = (error ?? {}) as {
    code?: string;
    message?: string;
  };
  return `${code ?? ""} ${message ?? ""}`.includes("permission-denied");
}

// Adds species data (name, images, watering frequency) to each plant. Species
// are cached by ID, so a change to one plant doesn't refetch every species.
// A species that couldn't be loaded isn't cached and is reported in `failed`,
// so the caller can try again later.
async function mergeWithBasePlants(
  plants: IUserPlant[],
  cache: BasePlantCache,
): Promise<{ plants: (IUserPlant | IUserPlantMerged)[]; failed: boolean }> {
  let failed = false;
  const merged = await Promise.all(
    plants.map(async (up) => {
      if (!up.plantId) return up;
      try {
        let pending = cache.get(up.plantId);
        if (!pending) {
          const request = fetchFirebasePlantById(up.plantId);
          pending = request;
          cache.set(up.plantId, request);
          // Forget a failure, so the next attempt asks again.
          request.catch(() => {
            if (cache.get(up.plantId) === request) cache.delete(up.plantId);
          });
        }
        const base = await pending;
        if (!base) return up;
        // Base fields first, then the user's own fields win.
        return { ...base, ...up, id: up.id } as IUserPlantMerged;
      } catch (e) {
        failed = true;
        console.warn("Couldn't load species data for a plant:", e);
        return up;
      }
    }),
  );
  return { plants: merged, failed };
}

/**
 * Loads the signed-in user's household and keeps its plants in Redux with a
 * live listener, so changes made on another device show up straight away.
 *
 * On first load it creates a household of the user's own if they have none,
 * and copies over plants from older builds.
 */
export const HouseholdProvider = ({ children }: ProviderProps) => {
  const { user, logout } = useContext(AuthContext);
  const dispatch = useDispatch();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [household, setHousehold] = useState<IHousehold | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] =
    useState<INotificationPrefs>({});
  // True while a join or leave is changing which household the user is in.
  const [paused, setPaused] = useState(false);

  const settingUp = useRef(false);
  const migrating = useRef(false);
  const basePlantCache = useRef<BasePlantCache>(new Map());
  const householdIdRef = useRef<string | null>(null);
  const pausedRef = useRef(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  householdIdRef.current = householdId;

  const resume = useCallback(() => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = null;
    pausedRef.current = false;
    setPaused(false);
  }, []);

  // Stop listening to the old household before a join or leave takes the
  // user's access to it away, and stay quiet until the profile points at the
  // new one.
  useEffect(() => {
    const unsubscribe = subscribeToMembershipChange((event) => {
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      pauseTimer.current = null;
      if (event.type === "start") {
        pausedRef.current = true;
        setPaused(true);
      } else if (!event.succeeded) {
        resume();
      } else {
        // The profile's householdId changes shortly; resume then. This is
        // the fallback if it doesn't.
        pauseTimer.current = setTimeout(resume, MEMBERSHIP_CHANGE_MAX_MS);
      }
    });
    return () => {
      unsubscribe();
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, [resume]);

  // Gives the user a household of their own, and says so if that fails.
  const setUpHousehold = useCallback((signedIn: FirebaseAuthTypes.User) => {
    if (settingUp.current) return;
    settingUp.current = true;
    createSoloHousehold(signedIn).catch((e) => {
      settingUp.current = false;
      console.warn("createSoloHousehold failed:", e);
      recordHandledError(e, "Create household");
      const message = "Couldn't set up your household. Please try again.";
      setSetupError(message);
      setError(message);
      setLoading(false);
    });
  }, []);

  const retrySetup = useCallback(() => {
    if (!user) return;
    setSetupError(null);
    setError(null);
    setLoading(true);
    settingUp.current = false;
    setUpHousehold(user);
  }, [user, setUpHousehold]);

  // 1. Follow the user's profile to find their household. Joining a household
  //    (the joinHousehold function) updates householdId here, and the app
  //    switches over live.
  useEffect(() => {
    if (!user) {
      setHouseholdId(null);
      setHousehold(null);
      setLoading(true);
      setError(null);
      setSetupError(null);
      setNotificationPrefs({});
      settingUp.current = false;
      migrating.current = false;
      resume();
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
        };
        setNotificationPrefs(profile.notificationPrefs ?? {});

        if (!profile.householdId) {
          setUpHousehold(user);
          return;
        }
        // A new household: the join or leave is done, so listen again.
        if (profile.householdId !== householdIdRef.current) resume();
        setSetupError(null);
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
  }, [user, dispatch, resume, setUpHousehold]);

  // Handles a failed household or plants listener. After leaving or joining,
  // the old household refuses the user: that's expected, so it isn't an
  // error. A refusal that outlasts a short grace period, with the user still
  // in the same household, is real.
  const reportListenerError = useCallback(
    (e: unknown, label: string, forHousehold: string, onReal: () => void) => {
      const stale = () =>
        pausedRef.current || householdIdRef.current !== forHousehold;

      if (!isPermissionDenied(e)) {
        console.warn(`${label} failed:`, e);
        recordHandledError(e, label);
        onReal();
        return undefined;
      }
      if (stale()) {
        console.log(`${label}: access to the old household ended`);
        return undefined;
      }
      return setTimeout(() => {
        if (stale()) return;
        console.warn(`${label} failed:`, e);
        recordHandledError(e, label);
        onReal();
      }, PERMISSION_GRACE_MS);
    },
    [],
  );

  // 2. Follow the household itself (name and members).
  useEffect(() => {
    if (!householdId || paused) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onSnapshot(
      householdDoc(getFirestore(), householdId),
      (snap) => {
        const data = snap?.data();
        setHousehold(data ? ({ ...data, id: householdId } as IHousehold) : null);
      },
      (e) => {
        timer = reportListenerError(e, "Household listener", householdId, () => {});
      },
    );
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [householdId, paused, reportListenerError]);

  // 3. Keep the household's plants in Redux, and clear reminders for plants
  //    someone has since watered.
  useEffect(() => {
    if (!householdId || !user || paused) return;

    let latest = 0;
    let errorTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let current: IUserPlant[] = [];

    const process = async (plants: IUserPlant[]) => {
      const run = ++latest;
      if (retryTimer) clearTimeout(retryTimer);

      const { plants: merged, failed } = await mergeWithBasePlants(
        plants,
        basePlantCache.current,
      );
      if (run !== latest) return; // a newer snapshot has arrived
      dispatch(setUserPlants(merged));
      setError(null);
      setLoading(false);

      // Reminders come from the server. Once a plant is watered, on this
      // phone or a housemate's, its reminder here is out of date.
      dismissStaleReminders(plants);

      // Species that couldn't load (offline, say) are tried again.
      if (failed) {
        retryTimer = setTimeout(() => {
          void process(current);
        }, SPECIES_RETRY_MS);
      }
    };

    const unsubscribe = onSnapshot(
      plantsCol(getFirestore(), householdId),
      (snap) => {
        current = (snap?.docs ?? []).map(
          (d: { data: () => unknown }) => d.data() as IUserPlant,
        );
        void process(current);
      },
      (e) => {
        errorTimer = reportListenerError(e, "Plants listener", householdId, () => {
          setError("Failed to load your plants. Please try again.");
          setLoading(false);
        });
      },
    );

    return () => {
      unsubscribe();
      latest += 1; // drop any merge still in flight
      if (errorTimer) clearTimeout(errorTimer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [householdId, user, paused, dispatch, reportListenerError]);

  const value = useMemo<HouseholdContextType>(
    () => ({
      household,
      loading,
      error,
      setupError,
      retrySetup,
      notificationPrefs,
      memberName: (uid) =>
        (uid && household?.members?.[uid]?.displayName) || null,
    }),
    [household, loading, error, setupError, retrySetup, notificationPrefs],
  );

  return (
    <HouseholdContext.Provider value={value}>
      {setupError ? (
        <ThemedView style={styles.failed} testID="household-setup-failed">
          <ThemedText type="subtitle">Couldn&apos;t set up your home</ThemedText>
          <ThemedText type="caption" style={styles.message}>
            Check your connection and try again.
          </ThemedText>
          <ThemedButton title="Try again" onPress={retrySetup} />
          <ThemedButton title="Log out" variant="ghost" onPress={logout} />
        </ThemedView>
      ) : (
        children
      )}
    </HouseholdContext.Provider>
  );
};

const styles = StyleSheet.create({
  failed: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.medium,
    padding: Spacing.xl,
  },
  message: {
    textAlign: "center",
  },
});
