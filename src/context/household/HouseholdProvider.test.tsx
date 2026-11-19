import { onSnapshot } from "@react-native-firebase/firestore";
import React from "react";
import { Provider } from "react-redux";

import { Text } from "react-native";

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import fetchFirebasePlantById from "@/helpers/firebase/fetchFirebasePlantById";
import { withMembershipChange } from "@/helpers/household/membershipChange";
import {
  createSoloHousehold,
  migrateUserPlants,
} from "@/helpers/household/setupHousehold";
import { recordHandledError } from "@/services/CrashReporting";
import { dismissStaleReminders } from "@/services/NotificationService";
import { setupStore } from "@/store/store";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockHousehold } from "@/test-utils/MockHousehold";
import { mockUserPlant } from "@/test-utils/MockPlant";

import {
  HouseholdProvider,
  PERMISSION_GRACE_MS,
  SPECIES_RETRY_MS,
  useHousehold,
} from "./HouseholdProvider";

jest.mock("@/services/PushRegistration", () => ({
  registerForPush: jest.fn(async () => null),
  unregisterForPush: jest.fn(async () => {}),
}));
jest.mock("@/helpers/household/setupHousehold", () => ({
  createSoloHousehold: jest.fn(async () => "user1"),
  migrateUserPlants: jest.fn(async () => 0),
}));
jest.mock("@/services/CrashReporting", () => ({
  recordHandledError: jest.fn(),
  setCrashReportingUser: jest.fn(),
}));
jest.mock("@/services/NotificationService", () => ({
  dismissStaleReminders: jest.fn(async () => {}),
}));
jest.mock("@/helpers/firebase/fetchFirebasePlantById", () =>
  jest.fn(async () => ({ id: "1", name: "Monstera", watering_frequency: 7 }))
);

type Snapshot = { data?: () => unknown; docs?: { data: () => unknown }[] };

// Serves the profile, household and plants listeners by the path asked for.
function serveSnapshots(profile: object, plants: object[] = []) {
  jest.mocked(onSnapshot).mockImplementation(((
    ref: { _path: string },
    onNext: (snap: Snapshot) => void
  ) => {
    if (ref._path.endsWith("/Plants")) {
      onNext({ docs: plants.map((p) => ({ data: () => p })) });
    } else if (ref._path.endsWith(`/${mockUser.uid}`)) {
      onNext({ data: () => profile });
    } else {
      onNext({ data: () => mockHousehold });
    }
    return jest.fn();
  }) as unknown as typeof onSnapshot);
}

let currentError: string | null = null;
const errorOf = () => currentError;

function HouseholdName() {
  const { household, loading, error } = useHousehold();
  currentError = error;
  return (
    <Text>{loading ? "loading" : (household?.name ?? "no household")}</Text>
  );
}

const mountProvider = (user: typeof mockUser | null = mockUser) => {
  const store = setupStore();
  render(
    <Provider store={store}>
      <AuthContext.Provider value={{ ...mockAuthContextValue, user }}>
        <HouseholdProvider>
          <HouseholdName />
        </HouseholdProvider>
      </AuthContext.Provider>
    </Provider>
  );
  return store;
};

describe("HouseholdProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the household and its plants, with species data merged in", async () => {
    serveSnapshots({ householdId: "household1", plantsMigratedAt: 1 }, [
      { ...mockUserPlant, addedBy: "user2", carerIds: ["user1", "user2"] },
      { ...mockUserPlant, id: "2", addedBy: "user2", carerIds: ["user2"] },
    ]);

    const store = mountProvider();

    expect(await screen.findByText("The Flat")).toBeTruthy();
    await waitFor(() => {
      expect(store.getState().userPlants).toEqual([
        expect.objectContaining({
          id: "1",
          name: "Monstera",
          addedBy: "user2",
        }),
        expect.objectContaining({ id: "2", addedBy: "user2" }),
      ]);
    });
    expect(fetchFirebasePlantById).toHaveBeenCalledWith("1");
    // Reminders for plants someone has since watered are cleared.
    expect(dismissStaleReminders).toHaveBeenCalledWith([
      expect.objectContaining({ id: "1" }),
      expect.objectContaining({ id: "2" }),
    ]);
    expect(createSoloHousehold).not.toHaveBeenCalled();
    expect(migrateUserPlants).not.toHaveBeenCalled();
  });

  it("sets up a household for someone who has none", async () => {
    serveSnapshots({});

    mountProvider();

    await waitFor(() => {
      expect(createSoloHousehold).toHaveBeenCalledWith(mockUser);
    });
  });

  it("moves plants from older builds across once", async () => {
    serveSnapshots({ householdId: "household1" });

    mountProvider();

    await waitFor(() => {
      expect(migrateUserPlants).toHaveBeenCalledWith(mockUser, "household1");
    });
  });

  it("switches to a new household when the profile's householdId changes", async () => {
    type Listener = {
      path: string;
      onNext: (snap: Snapshot) => void;
      onError: (e: Error) => void;
      unsubscribe: jest.Mock;
    };
    const listeners: Listener[] = [];
    jest.mocked(onSnapshot).mockImplementation(((
      ref: { _path: string },
      onNext: Listener["onNext"],
      onError: Listener["onError"]
    ) => {
      const unsubscribe = jest.fn();
      listeners.push({ path: ref._path, onNext, onError, unsubscribe });
      return unsubscribe;
    }) as unknown as typeof onSnapshot);
    const live = (suffix: string) =>
      listeners.filter(
        (l) => l.path.endsWith(suffix) && !l.unsubscribe.mock.calls.length
      );

    jest.spyOn(console, "warn").mockImplementation(() => {});
    const store = mountProvider();
    const profile = live(`/${mockUser.uid}`)[0];
    act(() => {
      profile.onNext({
        data: () => ({ householdId: "old", plantsMigratedAt: 1 }),
      });
    });
    await waitFor(() => expect(live("/Plants")).toHaveLength(1));
    const oldPlants = live("/Plants")[0];
    expect(oldPlants.path).toContain("/old/");

    // The old household's plants listener fails: an error shows.
    act(() => oldPlants.onError(new Error("unavailable")));
    expect(errorOf()).toBe("Failed to load your plants. Please try again.");

    // Joining a household updates the profile.
    act(() => {
      profile.onNext({
        data: () => ({ householdId: "new", plantsMigratedAt: 1 }),
      });
    });

    await waitFor(() => expect(oldPlants.unsubscribe).toHaveBeenCalled());
    await waitFor(() => expect(live("/Plants")).toHaveLength(1));
    const newPlants = live("/Plants")[0];
    expect(newPlants.path).toContain("/new/");
    expect(live("/new")).toHaveLength(1);

    await act(async () => {
      newPlants.onNext({
        docs: [{ data: () => ({ ...mockUserPlant, id: "9" }) }],
      });
    });

    await waitFor(() =>
      expect(store.getState().userPlants).toEqual([
        expect.objectContaining({ id: "9" }),
      ])
    );
    expect(screen.queryByText("loading")).toBeNull();
    expect(errorOf()).toBeNull();
  });

  describe("after a household setup failure", () => {
    it("offers Try again, and tries once more when it's pressed", async () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});
      jest
        .mocked(createSoloHousehold)
        .mockRejectedValueOnce(new Error("offline"));
      serveSnapshots({});

      mountProvider();

      expect(await screen.findByText("Try again")).toBeTruthy();
      expect(createSoloHousehold).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByText("Try again"));

      await waitFor(() => {
        expect(createSoloHousehold).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(screen.queryByText("Try again")).toBeNull();
      });
    });
  });

  describe("listeners around joining and leaving", () => {
    type Listener = {
      path: string;
      onNext: (snap: Snapshot) => void;
      onError: (e: unknown) => void;
      unsubscribe: jest.Mock;
    };
    let listeners: Listener[];
    const live = (suffix: string) =>
      listeners.filter(
        (l) => l.path.endsWith(suffix) && !l.unsubscribe.mock.calls.length
      );

    beforeEach(() => {
      listeners = [];
      jest.mocked(onSnapshot).mockImplementation(((
        ref: { _path: string },
        onNext: Listener["onNext"],
        onError: Listener["onError"]
      ) => {
        const unsubscribe = jest.fn();
        listeners.push({ path: ref._path, onNext, onError, unsubscribe });
        return unsubscribe;
      }) as unknown as typeof onSnapshot);
      jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.mocked(recordHandledError).mockClear();
    });

    const startInHousehold = async (id: string) => {
      mountProvider();
      act(() => {
        live(`/${mockUser.uid}`)[0].onNext({
          data: () => ({ householdId: id, plantsMigratedAt: 1 }),
        });
      });
      await waitFor(() => expect(live("/Plants")).toHaveLength(1));
    };

    it("stops listening to the old household before a join resolves", async () => {
      await startInHousehold("old");
      const oldPlants = live("/Plants")[0];

      let finishJoin!: () => void;
      const join = withMembershipChange(
        () => new Promise<void>((resolve) => (finishJoin = resolve))
      );

      await waitFor(() => expect(oldPlants.unsubscribe).toHaveBeenCalled());
      expect(live("/Plants")).toHaveLength(0);

      // The old household's refusal can't reach anyone: nobody is listening.
      finishJoin();
      await join;
      act(() => {
        live(`/${mockUser.uid}`)[0].onNext({
          data: () => ({ householdId: "new", plantsMigratedAt: 1 }),
        });
      });
      await waitFor(() => expect(live("/Plants")).toHaveLength(1));
      expect(live("/Plants")[0].path).toContain("/new/");
      expect(recordHandledError).not.toHaveBeenCalled();
      expect(errorOf()).toBeNull();
    });

    it("listens again if the join fails", async () => {
      await startInHousehold("old");

      await expect(
        withMembershipChange(() => Promise.reject(new Error("nope")))
      ).rejects.toThrow("nope");

      await waitFor(() => expect(live("/Plants")).toHaveLength(1));
      expect(live("/Plants")[0].path).toContain("/old/");
    });

    it("doesn't report permission-denied from a household that was just left", async () => {
      await startInHousehold("old");
      const oldPlants = live("/Plants")[0];

      act(() => oldPlants.onError({ code: "firestore/permission-denied" }));
      // The profile moves on before the grace period ends.
      act(() => {
        live(`/${mockUser.uid}`)[0].onNext({
          data: () => ({ householdId: "new", plantsMigratedAt: 1 }),
        });
      });
      await new Promise((resolve) =>
        setTimeout(() => resolve(undefined), PERMISSION_GRACE_MS + 100)
      );

      expect(recordHandledError).not.toHaveBeenCalled();
      expect(errorOf()).toBeNull();
    }, 10_000);

    it("reports permission-denied that lasts without a household change", async () => {
      await startInHousehold("old");

      act(() =>
        live("/Plants")[0].onError({ code: "firestore/permission-denied" })
      );
      expect(recordHandledError).not.toHaveBeenCalled();

      await waitFor(() => expect(recordHandledError).toHaveBeenCalledTimes(1), {
        timeout: PERMISSION_GRACE_MS + 2000,
      });
      expect(errorOf()).toBe("Failed to load your plants. Please try again.");
    }, 10_000);
  });

  it("tries a species again after it failed to load, without caching the failure", async () => {
    jest.useFakeTimers();
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest
      .mocked(fetchFirebasePlantById)
      .mockRejectedValueOnce({ code: "firestore/unavailable" });
    serveSnapshots({ householdId: "household1", plantsMigratedAt: 1 }, [
      { ...mockUserPlant },
    ]);

    const store = mountProvider();
    await waitFor(() => expect(store.getState().userPlants).toHaveLength(1));
    // Offline: the plant is there, but without species details.
    expect(store.getState().userPlants).toEqual([
      expect.objectContaining({ id: "1" }),
    ]);
    expect(store.getState().userPlants[0]).not.toHaveProperty(
      "name",
      "Monstera"
    );

    await act(async () => {
      jest.advanceTimersByTime(SPECIES_RETRY_MS + 100);
    });

    expect(fetchFirebasePlantById).toHaveBeenCalledTimes(2);
    expect(store.getState().userPlants[0]).toEqual(
      expect.objectContaining({ name: "Monstera" })
    );
    jest.useRealTimers();
  });

  it("does nothing while signed out", () => {
    mountProvider(null);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
