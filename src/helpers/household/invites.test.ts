import * as functionsModule from "@react-native-firebase/functions";

import {
  createInvite,
  formatInviteCode,
  joinErrorMessage,
  joinHousehold,
  leaveErrorMessage,
  leaveHousehold,
  previewInvite,
  removeMember,
} from "./invites";

const mockCallable = jest.fn();
const httpsCallable = (
  functionsModule as unknown as { _mockHttpsCallable: jest.Mock }
)._mockHttpsCallable;

beforeEach(() => {
  mockCallable.mockReset();
  httpsCallable.mockReset();
  httpsCallable.mockReturnValue(mockCallable);
});

describe("invites", () => {
  it("creates an invite", async () => {
    const invite = {
      code: "K7PXM3QH",
      expiresAt: 5,
      householdName: "The Flat",
    };
    mockCallable.mockResolvedValue({ data: invite });

    expect(await createInvite()).toEqual(invite);
    expect(httpsCallable).toHaveBeenCalledWith("createInvite");
  });

  it("previews a code without joining", async () => {
    const preview = {
      householdName: "The Flat",
      memberCount: 2,
      plantsMoving: 3,
    };
    mockCallable.mockResolvedValue({ data: preview });

    expect(await previewInvite("K7PX-M3QH")).toEqual(preview);
    expect(httpsCallable).toHaveBeenCalledWith("joinHousehold");
    expect(mockCallable).toHaveBeenCalledWith({
      code: "K7PX-M3QH",
      preview: true,
    });
  });

  it("joins with a code", async () => {
    mockCallable.mockResolvedValue({
      data: { householdId: "h", householdName: "The Flat" },
    });

    await joinHousehold("K7PX-M3QH");
    expect(mockCallable).toHaveBeenCalledWith({ code: "K7PX-M3QH" });
  });

  it("leaves the household", async () => {
    mockCallable.mockResolvedValue({ data: { householdId: "u1" } });

    expect(await leaveHousehold()).toEqual({ householdId: "u1" });
    expect(httpsCallable).toHaveBeenCalledWith("leaveHousehold");
  });

  it("removes a member", async () => {
    mockCallable.mockResolvedValue({ data: { householdId: "u2" } });

    await removeMember("u2");
    expect(httpsCallable).toHaveBeenCalledWith("removeMember");
    expect(mockCallable).toHaveBeenCalledWith({ uid: "u2" });
  });

  it("formats a code", () => {
    expect(formatInviteCode("K7PXM3QH")).toBe("K7PX-M3QH");
  });
});

describe("joinErrorMessage", () => {
  it.each([
    ["invalid-argument", "Check the code: it's 8 characters, like K7QM-3PXD."],
    ["not-found", "That code isn't valid or has expired."],
    ["already-exists", "You're already in this household."],
    ["failed-precondition", "Leave your current household first."],
    ["resource-exhausted", "This household is full."],
  ])("explains %s, with or without the functions/ prefix", (code, message) => {
    expect(joinErrorMessage({ code })).toBe(message);
    expect(joinErrorMessage({ code: `functions/${code}` })).toBe(message);
  });

  it("falls back for anything else", () => {
    const fallback = "Couldn't join. Check your connection and try again.";
    expect(joinErrorMessage({ code: "internal" })).toBe(fallback);
    expect(joinErrorMessage(new Error("boom"))).toBe(fallback);
    expect(joinErrorMessage(null)).toBe(fallback);
  });
});

describe("offline and rate limits", () => {
  const offline = "You're offline. Check your connection and try again.";
  const tooMany = "Too many tries. Wait a while and try again.";
  const limited = {
    code: "functions/resource-exhausted",
    message: "Too many requests. Try again in a minute.",
  };

  it("says you're offline rather than blaming the code", () => {
    expect(joinErrorMessage({ code: "functions/unavailable" })).toBe(offline);
    expect(leaveErrorMessage({ code: "unavailable" }, "fallback")).toBe(
      offline
    );
  });

  it("doesn't call a rate limit a full household", () => {
    expect(joinErrorMessage(limited)).toBe(tooMany);
    expect(leaveErrorMessage(limited, "fallback")).toBe(tooMany);
  });
});

describe("leaveErrorMessage", () => {
  it.each([
    ["failed-precondition", "You're the only one in this household."],
    [
      "permission-denied",
      "Only the person who set up the household can remove people.",
    ],
    ["not-found", "They're not in this household any more."],
  ])("explains %s", (code, message) => {
    expect(leaveErrorMessage({ code: `functions/${code}` }, "fallback")).toBe(
      message
    );
  });

  it("falls back for anything else", () => {
    expect(leaveErrorMessage({ code: "internal" }, "fallback")).toBe(
      "fallback"
    );
  });
});
