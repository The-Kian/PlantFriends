import { act, renderHook } from "@testing-library/react-native";

import { IPlant } from "@/constants/IPlant";
import fetchFirebasePlants from "@/helpers/firebase/fetchFirebasePlants";
import { fetchTreflePlants } from "@/helpers/plants/plantAPI/fetchTreflePlants";
import ErrorService from "@/services/ErrorService";
import { mockPlant, mockPlant2 } from "@/test-utils/MockPlant";

import { useCombinedPlantSearch } from "./useCombinedPlantSearch";

jest.mock("@/helpers/plants/plantAPI/fetchTreflePlants", () => ({
  fetchTreflePlants: jest.fn(),
}));
jest.mock("@/helpers/firebase/fetchFirebasePlants", () => jest.fn());
jest.mock("@/services/ErrorService");

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const renderSearch = (query: string) => renderHook<
  ReturnType<typeof useCombinedPlantSearch>,
  { query: string }
>(
  ({ query }) => useCombinedPlantSearch(query),
  { initialProps: { query } },
);

const flushSearch = async (milliseconds = 0) => {
  await act(async () => {
    jest.advanceTimersByTime(milliseconds);
  });
};

describe("useCombinedPlantSearch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    jest.mocked(fetchFirebasePlants).mockResolvedValue([]);
    jest.mocked(fetchTreflePlants).mockResolvedValue([]);
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("loads results from Trefle for a trimmed query", async () => {
    jest.mocked(fetchTreflePlants).mockResolvedValue([mockPlant]);
    const { result } = renderSearch(" test ");
    expect(result.current.loading).toBe(true);

    await flushSearch();

    expect(fetchFirebasePlants).toHaveBeenCalledWith("test");
    expect(fetchTreflePlants).toHaveBeenCalledWith("test");
    expect(result.current).toEqual({ plants: [mockPlant], loading: false, error: null });
  });

  it.each(["", "   "])("does not search a blank query (%j)", async (query) => {
    const { result } = renderSearch(query);
    await flushSearch(500);
    expect(result.current).toEqual({ plants: [], loading: false, error: null });
    expect(fetchFirebasePlants).not.toHaveBeenCalled();
    expect(fetchTreflePlants).not.toHaveBeenCalled();
  });

  it("keeps Firebase results when Trefle fails", async () => {
    const error = new Error("Trefle unavailable");
    jest.mocked(fetchFirebasePlants).mockResolvedValue([mockPlant]);
    jest.mocked(fetchTreflePlants).mockRejectedValue(error);
    const { result } = renderSearch("test");
    await flushSearch();
    expect(result.current).toEqual({ plants: [mockPlant], loading: false, error });
    expect(ErrorService.handleError).not.toHaveBeenCalled();
  });

  it("reports a Firebase failure through ErrorService", async () => {
    const error = new Error("Firebase unavailable");
    jest.mocked(fetchFirebasePlants).mockRejectedValue(error);
    const { result } = renderSearch("test");
    await flushSearch();
    expect(result.current).toEqual({ plants: [], loading: false, error });
    expect(fetchTreflePlants).not.toHaveBeenCalled();
    expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
    expect(ErrorService.handleError).toHaveBeenCalledWith(error, "Search Plants");
  });

  it("deduplicates by either id or name, preferring Firebase results", async () => {
    jest.mocked(fetchFirebasePlants).mockResolvedValue([mockPlant]);
    jest.mocked(fetchTreflePlants).mockResolvedValue([
      { ...mockPlant, name: "Same ID" },
      { ...mockPlant, id: "same-name" },
      mockPlant2,
    ]);
    const { result } = renderSearch("test");
    await flushSearch();
    expect(result.current.plants).toEqual([mockPlant, mockPlant2]);
  });

  it("debounces query changes before fetching", async () => {
    jest.mocked(fetchTreflePlants).mockResolvedValue([mockPlant]);
    const { result, rerender } = renderSearch("");
    rerender({ query: "te" });
    await flushSearch(250);
    rerender({ query: "test" });
    await flushSearch(499);
    expect(fetchFirebasePlants).not.toHaveBeenCalled();
    await flushSearch(1);
    expect(fetchFirebasePlants).toHaveBeenCalledTimes(1);
    expect(fetchTreflePlants).toHaveBeenCalledWith("test");
    expect(result.current.plants).toEqual([mockPlant]);
  });

  it("does not let an older result overwrite a newer search", async () => {
    const oldRequest = deferred<IPlant[]>();
    jest.mocked(fetchTreflePlants)
      .mockReturnValueOnce(oldRequest.promise)
      .mockResolvedValueOnce([mockPlant2]);
    const { result, rerender } = renderSearch("old");
    await flushSearch();
    rerender({ query: "new" });
    await flushSearch(500);
    expect(result.current.plants).toEqual([mockPlant2]);

    await act(async () => {
      oldRequest.resolve([mockPlant]);
    });
    expect(result.current).toEqual({ plants: [mockPlant2], loading: false, error: null });
  });

  it("does not let a stale rejection clear loading or set error for the current request", async () => {
    const oldRequest = deferred<IPlant[]>();
    const newRequest = deferred<IPlant[]>();
    jest.mocked(fetchFirebasePlants)
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    const { result, rerender } = renderSearch("old");
    rerender({ query: "new" });
    await flushSearch(500);

    await act(async () => {
      oldRequest.reject(new Error("Stale failure"));
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(ErrorService.handleError).not.toHaveBeenCalled();

    await act(async () => {
      newRequest.resolve([mockPlant2]);
    });
    expect(result.current).toEqual({ plants: [mockPlant2], loading: false, error: null });
  });

  it("invalidates a request before the next query finishes debouncing", async () => {
    const oldRequest = deferred<IPlant[]>();
    jest.mocked(fetchFirebasePlants).mockReturnValueOnce(oldRequest.promise);
    const { result, rerender } = renderSearch("old");
    rerender({ query: "new" });
    await act(async () => {
      oldRequest.resolve([mockPlant]);
    });
    expect(result.current.plants).toEqual([]);
    expect(fetchTreflePlants).not.toHaveBeenCalled();
    await flushSearch(500);
    expect(fetchTreflePlants).toHaveBeenCalledWith("new");
  });

  it.each(["", "   "])("clears loading immediately and ignores pending results for %j", async (query) => {
    const pending = deferred<IPlant[]>();
    jest.mocked(fetchTreflePlants).mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderSearch("test");
    await flushSearch();
    expect(result.current.loading).toBe(true);
    rerender({ query });
    expect(result.current).toEqual({ plants: [], loading: false, error: null });

    await act(async () => {
      pending.resolve([mockPlant]);
    });
    await flushSearch(500);
    expect(result.current).toEqual({ plants: [], loading: false, error: null });
    expect(fetchFirebasePlants).toHaveBeenCalledTimes(1);
  });

  it.each(["", "   "])("clears existing results and error immediately for %j", async (query) => {
    jest.mocked(fetchFirebasePlants).mockResolvedValue([mockPlant]);
    jest.mocked(fetchTreflePlants).mockRejectedValue(new Error("API failed"));
    const { result, rerender } = renderSearch("test");
    await flushSearch();
    expect(result.current.plants).toEqual([mockPlant]);
    expect(result.current.error).not.toBeNull();
    rerender({ query });
    expect(result.current).toEqual({ plants: [], loading: false, error: null });
  });

  it("ignores a pending Trefle rejection after unmount", async () => {
    const pending = deferred<IPlant[]>();
    jest.mocked(fetchTreflePlants).mockReturnValueOnce(pending.promise);
    const { unmount } = renderSearch("test");
    await flushSearch();
    unmount();
    await act(async () => {
      pending.reject(new Error("Late API failure"));
    });
    expect(console.warn).not.toHaveBeenCalled();
    expect(ErrorService.handleError).not.toHaveBeenCalled();
  });
});
