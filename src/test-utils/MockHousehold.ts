import { IHousehold } from "@/constants/IPlant";
import { HouseholdContextType } from "@/context/household/HouseholdProvider";

// user1 matches MockFirebaseUser.
export const mockHousehold: IHousehold = {
  id: "household1",
  name: "The Flat",
  memberIds: ["user1"],
  members: { user1: { displayName: "Kian" } },
  createdBy: "user1",
  timeZone: "Europe/London",
};

export function mockHouseholdContext(
  overrides: Partial<HouseholdContextType> = {},
): HouseholdContextType {
  return {
    household: mockHousehold,
    loading: false,
    error: null,
    ...overrides,
  };
}
