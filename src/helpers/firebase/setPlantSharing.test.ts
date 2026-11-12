/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import { mockHousehold } from "@/test-utils/MockHousehold";
import { mockUserPlant } from "@/test-utils/MockPlant";

import setPlantSharing from "./setPlantSharing";

const mockUpdate = (firestore as any)._mockUpdate as jest.Mock;

describe("setPlantSharing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("makes every member a carer of a shared plant", async () => {
    const plant = { ...mockUserPlant, addedBy: "user2", carerIds: ["user2"] };

    const result = await setPlantSharing(mockHousehold, plant, true, "user1");

    const sharing = { shared: true, carerIds: ["user1", "user2"] };
    expect(mockUpdate).toHaveBeenCalledWith(sharing);
    expect(result).toEqual({ ...plant, ...sharing });
  });

  it("gives a personal plant back to whoever added it", async () => {
    const plant = {
      ...mockUserPlant,
      addedBy: "user2",
      shared: true,
      carerIds: ["user1", "user2"],
    };

    await setPlantSharing(mockHousehold, plant, false, "user1");

    expect(mockUpdate).toHaveBeenCalledWith({ shared: false, carerIds: ["user2"] });
  });

  it("passes on a failed write", async () => {
    mockUpdate.mockRejectedValueOnce(new Error("permission-denied"));

    await expect(
      setPlantSharing(mockHousehold, mockUserPlant, true, "user1"),
    ).rejects.toThrow("permission-denied");
  });
});
