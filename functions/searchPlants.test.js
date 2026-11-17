// searchPlants: key check before the rate limit, and the Trefle timeout.
const mockRateLimit = jest.fn(async () => {});

jest.mock("./admin", () => ({
  initializeApp: () => {},
  db: () => ({}),
}));

jest.mock("./guards", () => ({
  MAX_INSTANCES: 1,
  requireCaller: (context) => context.auth.uid,
  requireString: (value) => value,
  redact: (text) => String(text),
  rateLimit: (...args) => mockRateLimit(...args),
}));

jest.mock(
  "firebase-functions/v1",
  () => {
    class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }
    const https = { onCall: (handler) => handler, HttpsError };
    const pubsub = { schedule: () => ({ onRun: (handler) => handler }) };
    const firestore = { document: () => ({ onWrite: (handler) => handler }) };
    return {
      https,
      pubsub,
      firestore,
      runWith: () => ({ https, pubsub, firestore }),
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    };
  },
  { virtual: true }
);

const { searchPlants } = require("./index");

const call = () => searchPlants({ q: "monstera" }, { auth: { uid: "u1" } });

const originalFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.TREFLE_API_KEY = "secret";
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

describe("searchPlants", () => {
  it("checks the API key before spending a rate-limit slot", async () => {
    delete process.env.TREFLE_API_KEY;
    await expect(call()).rejects.toMatchObject({ code: "failed-precondition" });
    expect(mockRateLimit).not.toHaveBeenCalled();
  });

  it("passes an abort signal to Trefle and returns the plants", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    }));
    expect(await call()).toEqual({ plants: [] });
    expect(mockRateLimit).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("gives up after 8 seconds with a clear error", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(
      (url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
          );
        })
    );

    const pending = call();
    const outcome = expect(pending).rejects.toMatchObject({
      code: "deadline-exceeded",
    });
    await jest.advanceTimersByTimeAsync(8000);
    await outcome;
  });
});
