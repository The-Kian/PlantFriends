jest.mock("./admin", () => ({ db: jest.fn() }));
jest.mock(
  "firebase-functions/v1",
  () => {
    class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }
    return { https: { HttpsError } };
  },
  { virtual: true }, // CI doesn't install functions/ dependencies
);

const { nextWindow, requireCaller, requireString, redact } = require("./guards");

const MINUTE = 60 * 1000;

describe("nextWindow", () => {
  test("starts a window on the first call", () => {
    expect(nextWindow(null, 1000, 30, MINUTE)).toEqual({
      allowed: true,
      window: { start: 1000, count: 1 },
    });
  });

  test("counts calls and stops at the limit", () => {
    expect(nextWindow({ start: 0, count: 29 }, 10, 30, MINUTE)).toEqual({
      allowed: true,
      window: { start: 0, count: 30 },
    });
    expect(nextWindow({ start: 0, count: 30 }, 10, 30, MINUTE).allowed).toBe(false);
  });

  test("starts again once the window has passed", () => {
    expect(nextWindow({ start: 0, count: 30 }, MINUTE, 30, MINUTE)).toEqual({
      allowed: true,
      window: { start: MINUTE, count: 1 },
    });
  });
});

describe("requireCaller", () => {
  afterEach(() => {
    delete process.env.ENFORCE_APP_CHECK;
  });

  test("needs a signed-in caller", () => {
    expect(() => requireCaller({})).toThrow(expect.objectContaining({ code: "unauthenticated" }));
    expect(requireCaller({ auth: { uid: "u1" } })).toBe("u1");
  });

  test("needs App Check only when enforced", () => {
    process.env.ENFORCE_APP_CHECK = "true";
    expect(() => requireCaller({ auth: { uid: "u1" } })).toThrow(
      expect.objectContaining({ code: "failed-precondition" }),
    );
    expect(requireCaller({ auth: { uid: "u1" }, app: { appId: "a" } })).toBe("u1");
  });
});

describe("requireString", () => {
  test("accepts and trims text within the limit", () => {
    expect(requireString("  fern ", "q", 100)).toBe("fern");
  });

  test.each([undefined, null, 5, {}, "", "   ", "x".repeat(101)])("rejects %p", (value) => {
    expect(() => requireString(value, "q", 100)).toThrow(
      expect.objectContaining({ code: "invalid-argument" }),
    );
  });
});

test("redact removes secrets", () => {
  expect(redact("https://x/?token=abc123&q=1", ["abc123", undefined])).toBe(
    "https://x/?token=[redacted]&q=1",
  );
});
