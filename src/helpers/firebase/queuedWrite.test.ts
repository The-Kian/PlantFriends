import { recordHandledError } from "@/services/CrashReporting";

import { queuedWrite } from "./queuedWrite";


jest.mock("@/services/CrashReporting", () => ({
  recordHandledError: jest.fn(),
}));

describe("queuedWrite", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it("resolves when the server accepts the write", async () => {
    await expect(queuedWrite(Promise.resolve(), "t")).resolves.toBeUndefined();
  });

  it("throws a rejection that arrives in time", async () => {
    await expect(
      queuedWrite(Promise.reject(new Error("denied")), "t"),
    ).rejects.toThrow("denied");
  });

  it("stops waiting after the grace period when offline", async () => {
    const pending = new Promise<void>(() => undefined);
    const done = queuedWrite(pending, "t", 3000);
    await jest.advanceTimersByTimeAsync(3000);
    await expect(done).resolves.toBeUndefined();
  });

  it("records a rejection that arrives after the grace period", async () => {
    let fail: (e: Error) => void = () => undefined;
    const late = new Promise<void>((_, reject) => {
      fail = reject;
    });
    const done = queuedWrite(late, "Save", 3000);
    await jest.advanceTimersByTimeAsync(3000);
    await done;
    fail(new Error("rules"));
    await jest.advanceTimersByTimeAsync(0);
    expect(recordHandledError).toHaveBeenCalledWith(
      expect.any(Error),
      "Save (after going offline)",
    );
  });
});
