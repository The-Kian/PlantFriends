/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import { waitFor } from "@testing-library/react-native";

import { calculateNextWateringDate } from "@/helpers/plants/wateringCalculations";
import ErrorService from "@/services/ErrorService";
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

  it("writes only the watering fields, with who watered it", () => {
    const plant = { ...mockUserPlant, custom_notes: "Mist on Sundays" };

    const result = logWatering(
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

  it("returns at once while the write is still waiting on the server", () => {
    mockUpdate.mockReturnValueOnce(new Promise(() => {}));

    const result = logWatering(
      "household1",
      mockUserPlant,
      { uid: "user1", displayName: "Kian" },
      3,
    );

    expect(result.last_watered_by).toBe("user1");
  });

  it("tells the user when the server refuses the write", async () => {
    const error = new Error("permission-denied");
    const handleError = jest
      .spyOn(ErrorService, "handleError")
      .mockImplementation(() => {});
    mockUpdate.mockRejectedValueOnce(error);

    logWatering(
      "household1",
      mockUserPlant,
      { uid: "user1", displayName: "Kian" },
      3,
    );

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith(
        error,
        "Log Watering",
        expect.objectContaining({ userMessage: expect.any(String) }),
      );
    });
  });
});
