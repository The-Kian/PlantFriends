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

  it("tells the screen when it is still waiting, and when the write finally arrives", async () => {
    let arrive: () => void = () => undefined;
    const late = new Promise<void>((resolve) => {
      arrive = resolve;
    });
    const hooks = { onWaiting: jest.fn(), onSynced: jest.fn() };
    const done = queuedWrite(late, "t", 3000, hooks);

    await jest.advanceTimersByTimeAsync(2999);
    expect(hooks.onWaiting).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    await done;
    expect(hooks.onWaiting).toHaveBeenCalledTimes(1);
    expect(hooks.onSynced).not.toHaveBeenCalled();

    arrive();
    await jest.advanceTimersByTimeAsync(0);
    expect(hooks.onSynced).toHaveBeenCalledTimes(1);
  });

  it("doesn't call the hooks for a write that arrives in time", async () => {
    const hooks = { onWaiting: jest.fn(), onSynced: jest.fn() };
    await queuedWrite(Promise.resolve(), "t", 3000, hooks);
    await jest.advanceTimersByTimeAsync(5000);
    expect(hooks.onWaiting).not.toHaveBeenCalled();
    expect(hooks.onSynced).not.toHaveBeenCalled();
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
