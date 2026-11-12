import React from "react";

import { screen } from "@testing-library/react-native";

import { IUserPlant } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import useMergedPlant from "@/hooks/plants/useMergedPlant";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockHousehold, mockHouseholdContext } from "@/test-utils/MockHousehold";
import { mockUserPlant } from "@/test-utils/MockPlant";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

import PlantCard from "./plantCard";

jest.mock("@/hooks/plants/useMergedPlant");

describe("PlantCard", () => {
  const now = new Date("2026-10-05T12:00:00Z").getTime();
  const day = 24 * 60 * 60 * 1000;

  const renderCard = (
    plant: IUserPlant,
    household = mockHouseholdContext(),
  ) =>
    renderWithProviders(
      <AuthContext.Provider value={{ ...mockAuthContextValue, user: mockUser }}>
        <PlantCard plant={plant} onPress={jest.fn()} onDelete={jest.fn()} />
      </AuthContext.Provider>,
      { household },
    );

  beforeEach(() => {
    jest.mocked(useMergedPlant).mockReturnValue({ mergedPlant: null, loading: false });
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("says which housemate did the last watering", () => {
    renderCard({
      ...mockUserPlant,
      addedBy: "user1",
      last_watered_date: now - 2 * day,
      last_watered_by: "user2",
      last_watered_by_name: "Sam",
    });

    expect(screen.getByText("Watered 2 days ago by Sam")).toBeTruthy();
  });

  it("leaves the name off when you watered it yourself", () => {
    renderCard({
      ...mockUserPlant,
      addedBy: "user1",
      last_watered_date: now - 2 * day,
      last_watered_by: "user1",
      last_watered_by_name: "Kian",
    });

    expect(screen.getByText("Watered 2 days ago")).toBeTruthy();
  });

  it("badges a shared plant and a housemate's own plant", () => {
    renderCard({ ...mockUserPlant, addedBy: "user1", shared: true });
    expect(screen.getByText("Shared")).toBeTruthy();

    renderCard({ ...mockUserPlant, id: "2", addedBy: "user2", shared: false });
    expect(screen.getByText("Sam's")).toBeTruthy();
  });

  it("shows no badge when you live alone", () => {
    renderCard(
      { ...mockUserPlant, addedBy: "user1", shared: true },
      mockHouseholdContext({
        household: { ...mockHousehold, memberIds: ["user1"] },
      }),
    );

    expect(screen.queryByText("Shared")).toBeNull();
  });
});
