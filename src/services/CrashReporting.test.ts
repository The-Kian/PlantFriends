import {
  log,
  recordError,
  setUserId,
} from "@react-native-firebase/crashlytics";

import { recordHandledError, setCrashReportingUser } from "./CrashReporting";

describe("CrashReporting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records Error instances with context", () => {
    const error = new Error("boom");
    recordHandledError(error, "Search");

    expect(log).toHaveBeenCalledWith(expect.anything(), "Search");
    expect(recordError).toHaveBeenCalledWith(expect.anything(), error, "Search");
  });

  it("wraps Firebase-style error objects in an Error", () => {
    recordHandledError({ code: "auth/network-request-failed", message: "offline" });

    const recorded = (recordError as jest.Mock).mock.calls[0][1];
    expect(recorded).toBeInstanceOf(Error);
    expect(recorded.message).toBe("auth/network-request-failed: offline");
  });

  it("never throws if Crashlytics fails", () => {
    (recordError as jest.Mock).mockImplementationOnce(() => {
      throw new Error("native module missing");
    });
    expect(() => recordHandledError(new Error("boom"))).not.toThrow();
  });

  it("sets and clears the user id", () => {
    setCrashReportingUser("uid-1");
    setCrashReportingUser(null);

    expect(setUserId).toHaveBeenNthCalledWith(1, expect.anything(), "uid-1");
    expect(setUserId).toHaveBeenNthCalledWith(2, expect.anything(), "");
  });
});
