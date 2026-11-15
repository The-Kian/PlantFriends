import { onSnapshot } from "@react-native-firebase/firestore";
import React from "react";
import { Provider } from "react-redux";

import { Text } from "react-native";

import { act, render, screen, waitFor } from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import fetchFirebasePlantById from "@/helpers/firebase/fetchFirebasePlantById";
import {
  createSoloHousehold,
  migrateUserPlants,
} from "@/helpers/household/setupHousehold";
import { syncAllWateringReminders } from "@/services/NotificationService";
import { setupStore } from "@/store/store";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockHousehold } from "@/test-utils/MockHousehold";
import { mockUserPlant } from "@/test-utils/MockPlant";

import { HouseholdProvider, useHousehold } from "./HouseholdProvider";

jest.mock("@/services/PushRegistration", () => ({
  registerForPush: jest.fn(async () => null),
  unregisterForPush: jest.fn(async () => {}),
}));
jest.mock("@/helpers/household/setupHousehold", () => ({
  createSoloHousehold: jest.fn(async () => "user1"),
  migrateUserPlants: jest.fn(async () => 0),
}));
jest.mock("@/services/NotificationService", () => ({
  syncAllWateringReminders: jest.fn(async () => {}),
}));
jest.mock("@/helpers/firebase/fetchFirebasePlantById", () =>
  jest.fn(async () => ({ id: "1", name: "Monstera", watering_frequency: 7 })),
);

type Snapshot = { data?: () => unknown; docs?: { data: () => unknown }[] };

// Serves the profile, household and plants listeners by the path asked for.
function serveSnapshots(profile: object, plants: object[] = []) {
  jest.mocked(onSnapshot).mockImplementation(((
    ref: { _path: string },
    onNext: (snap: Snapshot) => void,
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
  return <Text>{loading ? "loading" : household?.name ?? "no household"}</Text>;
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
    </Provider>,
  );
  return store;
};

describe("HouseholdProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the household and its plants, with species data merged in", async () => {
    serveSnapshots(
      { householdId: "household1", plantsMigratedAt: 1 },
      [
        { ...mockUserPlant, addedBy: "user2", carerIds: ["user1", "user2"] },
        { ...mockUserPlant, id: "2", addedBy: "user2", carerIds: ["user2"] },
      ],
    );

    const store = mountProvider();

    expect(await screen.findByText("The Flat")).toBeTruthy();
    await waitFor(() => {
      expect(store.getState().userPlants).toEqual([
        expect.objectContaining({ id: "1", name: "Monstera", addedBy: "user2" }),
        expect.objectContaining({ id: "2", addedBy: "user2" }),
      ]);
    });
    expect(fetchFirebasePlantById).toHaveBeenCalledWith("1");
    // Reminders are still scheduled on the device, only for plants this
    // person looks after.
    expect(syncAllWateringReminders).toHaveBeenCalledWith([
      expect.objectContaining({ id: "1" }),
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
      onError: Listener["onError"],
    ) => {
      const unsubscribe = jest.fn();
      listeners.push({ path: ref._path, onNext, onError, unsubscribe });
      return unsubscribe;
    }) as unknown as typeof onSnapshot);
    const live = (suffix: string) =>
      listeners.filter((l) => l.path.endsWith(suffix) && !l.unsubscribe.mock.calls.length);

    jest.spyOn(console, "warn").mockImplementation(() => {});
    const store = mountProvider();
    const profile = live(`/${mockUser.uid}`)[0];
    act(() => {
      profile.onNext({ data: () => ({ householdId: "old", plantsMigratedAt: 1 }) });
    });
    await waitFor(() => expect(live("/Plants")).toHaveLength(1));
    const oldPlants = live("/Plants")[0];
    expect(oldPlants.path).toContain("/old/");

    // The old household's plants listener fails: an error shows.
    act(() => oldPlants.onError(new Error("permission-denied")));
    expect(errorOf()).toBe("Failed to load your plants. Please try again.");

    // Joining a household updates the profile.
    act(() => {
      profile.onNext({ data: () => ({ householdId: "new", plantsMigratedAt: 1 }) });
    });

    await waitFor(() => expect(oldPlants.unsubscribe).toHaveBeenCalled());
    await waitFor(() => expect(live("/Plants")).toHaveLength(1));
    const newPlants = live("/Plants")[0];
    expect(newPlants.path).toContain("/new/");
    expect(live("/new")).toHaveLength(1);

    await act(async () => {
      newPlants.onNext({ docs: [{ data: () => ({ ...mockUserPlant, id: "9" }) }] });
    });

    await waitFor(() =>
      expect(store.getState().userPlants).toEqual([expect.objectContaining({ id: "9" })]),
    );
    expect(screen.queryByText("loading")).toBeNull();
    expect(errorOf()).toBeNull();
  });

  it("sets up a new household each time the householdId is cleared, as after leaving", async () => {
    let onProfile: (snap: Snapshot) => void = () => {};
    jest.mocked(onSnapshot).mockImplementation(((
      ref: { _path: string },
      onNext: (snap: Snapshot) => void,
    ) => {
      // The profile's mock path ends in the uid (household IDs here differ from it).
      if (ref._path.endsWith(`/${mockUser.uid}`)) onProfile = onNext;
      return jest.fn();
    }) as unknown as typeof onSnapshot);
    const store = mountProvider();

    // First sign-in: no household yet, so one is set up.
    act(() => onProfile({ data: () => ({}) }));
    await waitFor(() => expect(createSoloHousehold).toHaveBeenCalledTimes(1));

    // The set-up writes householdId; the profile now has one.
    act(() => onProfile({ data: () => ({ householdId: "solo1", plantsMigratedAt: 1 }) }));

    // Joined a shared household, then left: the server clears householdId.
    act(() => onProfile({ data: () => ({ householdId: "shared", plantsMigratedAt: 1 }) }));
    act(() => onProfile({ data: () => ({ plantsMigratedAt: 1 }) }));

    await waitFor(() => expect(createSoloHousehold).toHaveBeenCalledTimes(2));
    // Nothing from the old household is left on screen.
    expect(screen.getByText("loading")).toBeTruthy();
    expect(store.getState().userPlants).toEqual([]);
  });

  it("does nothing while signed out", () => {
    mountProvider(null);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
