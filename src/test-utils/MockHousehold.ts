import { IHousehold } from "@/constants/IPlant";
import { HouseholdContextType } from "@/context/household/HouseholdProvider";

// user1 matches MockFirebaseUser; user2 is their housemate.
export const mockHousehold: IHousehold = {
  id: "household1",
  name: "The Flat",
  memberIds: ["user1", "user2"],
  members: {
    user1: { displayName: "Kian" },
    user2: { displayName: "Sam" },
  },
  createdBy: "user1",
  timeZone: "Europe/London",
};

export function mockHouseholdContext(
  overrides: Partial<HouseholdContextType> = {},
): HouseholdContextType {
  const household = overrides.household ?? mockHousehold;
  return {
    household,
    loading: false,
    error: null,
    notificationPrefs: {},
    memberName: (uid) =>
      (uid && household?.members[uid]?.displayName) || null,
    ...overrides,
  };
}
