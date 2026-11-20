/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import { waitFor } from "@testing-library/react-native";

import { QUEUED_WRITE_GRACE_MS } from "@/helpers/firebase/queuedWrite";
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
      7
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
      3
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
      3
    );

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith(
        error,
        "Log Watering",
        expect.objectContaining({ userMessage: expect.any(String) })
      );
    });
  });

  it("reports waiting after the grace period and synced once the server has it", async () => {
    jest.useFakeTimers();
    try {
      let resolve: () => void = () => {};
      mockUpdate.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)));
      const onWaiting = jest.fn();
      const onSynced = jest.fn();

      logWatering(
        "household1",
        mockUserPlant,
        { uid: "user1", displayName: "Kian" },
        3,
        { onWaiting, onSynced }
      );
      jest.advanceTimersByTime(QUEUED_WRITE_GRACE_MS);
      expect(onWaiting).toHaveBeenCalledTimes(1);
      expect(onSynced).not.toHaveBeenCalled();

      resolve();
      for (let i = 0; i < 5; i++) await Promise.resolve();
      expect(onSynced).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("never reports waiting when the server answers quickly", async () => {
    const onWaiting = jest.fn();
    logWatering(
      "household1",
      mockUserPlant,
      { uid: "user1", displayName: "Kian" },
      3,
      { onWaiting }
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(onWaiting).not.toHaveBeenCalled();
  });
});
