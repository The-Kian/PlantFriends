import { onSnapshot } from "@react-native-firebase/firestore";
import React from "react";
import { Provider } from "react-redux";

import { Text } from "react-native";

import { render, screen, waitFor } from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import fetchFirebasePlantById from "@/helpers/firebase/fetchFirebasePlantById";
import {
  createSoloHousehold,
  migrateUserPlants,
} from "@/helpers/household/setupHousehold";
import { setupStore } from "@/store/store";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockHousehold } from "@/test-utils/MockHousehold";
import { mockUserPlant } from "@/test-utils/MockPlant";

import { HouseholdProvider, useHousehold } from "./HouseholdProvider";

jest.mock("@/helpers/household/setupHousehold", () => ({
  createSoloHousehold: jest.fn(async () => "user1"),
  migrateUserPlants: jest.fn(async () => 0),
}));
jest.mock("@/helpers/firebase/fetchFirebasePlantById", () =>
  jest.fn(async () => ({ id: "1", name: "Monstera", watering_frequency: 7 })),
);
jest.mock("@/services/PushRegistration", () => ({
  registerForPush: jest.fn(async () => null),
}));

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

function HouseholdName() {
  const { household, loading } = useHousehold();
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
      [{ ...mockUserPlant, addedBy: "user2" }],
    );

    const store = mountProvider();

    expect(await screen.findByText("The Flat")).toBeTruthy();
    await waitFor(() => {
      expect(store.getState().userPlants).toEqual([
        expect.objectContaining({ id: "1", name: "Monstera", addedBy: "user2" }),
      ]);
    });
    expect(fetchFirebasePlantById).toHaveBeenCalledWith("1");
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

  it("does nothing while signed out", () => {
    mountProvider(null);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
