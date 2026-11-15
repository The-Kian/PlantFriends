import {
  errorCode,
  isOfflineError,
  isRateLimited,
  searchErrorMessage,
} from "./friendlyErrors";

describe("errorCode", () => {
  it("drops the Firebase prefix", () => {
    expect(errorCode({ code: "functions/not-found" })).toBe("not-found");
    expect(errorCode({ code: "firestore/unavailable" })).toBe("unavailable");
    expect(errorCode({ code: "internal" })).toBe("internal");
    expect(errorCode(new Error("boom"))).toBe("");
    expect(errorCode(null)).toBe("");
  });
});

describe("isOfflineError", () => {
  it.each([
    { code: "functions/unavailable" },
    { code: "unavailable" },
    { code: "firestore/deadline-exceeded" },
    { code: "auth/network-request-failed" },
    new Error("Network request failed"),
  ])("is true for %p", (error) => {
    expect(isOfflineError(error)).toBe(true);
  });

  it("is false for other failures", () => {
    expect(isOfflineError({ code: "functions/internal" })).toBe(false);
    expect(isOfflineError(new Error("boom"))).toBe(false);
    expect(isOfflineError(undefined)).toBe(false);
  });
});

describe("isRateLimited", () => {
  it("tells a rate limit from a full household", () => {
    expect(
      isRateLimited({
        code: "functions/resource-exhausted",
        message: "Too many requests. Try again in a minute.",
      }),
    ).toBe(true);
    expect(
      isRateLimited({
        code: "resource-exhausted",
        message: "This household is full.",
      }),
    ).toBe(false);
  });
});

describe("searchErrorMessage", () => {
  it("says when the phone is offline", () => {
    expect(searchErrorMessage({ code: "unavailable" }, false)).toMatch(
      /offline/,
    );
  });

  it("says when there were too many searches", () => {
    expect(
      searchErrorMessage(
        { code: "resource-exhausted", message: "Too many requests." },
        true,
      ),
    ).toMatch(/Too many searches/);
  });

  it("explains partial results, and points at adding by hand when there are none", () => {
    expect(searchErrorMessage(new Error("boom"), true)).toMatch(
      /other people have added/,
    );
    expect(searchErrorMessage(new Error("boom"), false)).toMatch(
      /add the plant yourself/,
    );
  });
});
