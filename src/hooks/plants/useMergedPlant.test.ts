import { renderHook, waitFor } from "@testing-library/react-native";

import fetchFirebasePlantById from "@/helpers/firebase/fetchFirebasePlantById";
import { mockUserPlant } from "@/test-utils/MockPlant";

import useMergedPlant, { clearMergedPlantCache } from "./useMergedPlant";

jest.mock("@/helpers/firebase/fetchFirebasePlantById");

// A user plant that hasn't been merged with its species yet.
const bare = { ...mockUserPlant, plantId: "species-1" };
delete (bare as { name?: string }).name;
delete (bare as { images?: string[] }).images;

describe("useMergedPlant", () => {
  beforeEach(() => {
    clearMergedPlantCache();
    jest.mocked(fetchFirebasePlantById).mockReset();
  });

  it("doesn't remember a failed lookup, and tries again next time", async () => {
    jest
      .mocked(fetchFirebasePlantById)
      .mockRejectedValueOnce({ code: "firestore/unavailable" })
      .mockResolvedValueOnce({ id: "species-1", name: "Monstera" } as never);

    const view = renderHook(() => useMergedPlant(bare));
    await waitFor(() => expect(view.result.current.unavailable).toBe(true));
    expect(view.result.current.mergedPlant).toBeNull();

    const utils = renderHook(() => useMergedPlant(bare));
    await waitFor(() =>
      expect(utils.result.current.mergedPlant?.name).toBe("Monstera")
    );
    expect(utils.result.current.unavailable).toBe(false);
    expect(fetchFirebasePlantById).toHaveBeenCalledTimes(2);
  });
});
