/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import { calculateNextWateringDate } from "@/helpers/plants/wateringCalculations";
import { mockUserPlant } from "@/test-utils/MockPlant";

import logWatering from "./logWatering";

const mockUpdate = (firestore as any)._mockUpdate as jest.Mock;

describe("logWatering", () => {
  const now = new Date("2026-10-05T09:00:00Z").getTime();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("writes only the watering fields, with who watered it", async () => {
    const plant = { ...mockUserPlant, custom_notes: "Mist on Sundays" };

    const result = await logWatering(
      "household1",
      plant,
      { uid: "user2", displayName: "Sam" },
      7,
    );

    const watering = {
      last_watered_date: now,
      next_watering_date: calculateNextWateringDate(now, 7),
      last_watered_by: "user2",
      last_watered_by_name: "Sam",
    };
    expect(mockUpdate).toHaveBeenCalledWith(watering);
    expect(result).toEqual({ ...plant, ...watering });
  });

  it("passes on a failed write", async () => {
    mockUpdate.mockRejectedValueOnce(new Error("permission-denied"));

    await expect(
      logWatering("household1", mockUserPlant, { uid: "user1", displayName: "Kian" }, 3),
    ).rejects.toThrow("permission-denied");
  });
});
