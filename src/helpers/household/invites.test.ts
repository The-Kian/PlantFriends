import functions from "@react-native-firebase/functions";

import {
  createInvite,
  formatInviteCode,
  joinErrorMessage,
  joinHousehold,
  previewInvite,
} from "./invites";

const mockCallable = jest.fn();
const httpsCallable = (
  functions as unknown as { _mockHttpsCallable: jest.Mock }
)._mockHttpsCallable;

beforeEach(() => {
  mockCallable.mockReset();
  httpsCallable.mockReset();
  httpsCallable.mockReturnValue(mockCallable);
});

describe("invites", () => {
  it("creates an invite", async () => {
    const invite = { code: "K7PXM3QH", expiresAt: 5, householdName: "The Flat" };
    mockCallable.mockResolvedValue({ data: invite });

    expect(await createInvite()).toEqual(invite);
    expect(httpsCallable).toHaveBeenCalledWith("createInvite");
  });

  it("previews a code without joining", async () => {
    const preview = { householdName: "The Flat", memberCount: 2, plantsMoving: 3 };
    mockCallable.mockResolvedValue({ data: preview });

    expect(await previewInvite("K7PX-M3QH")).toEqual(preview);
    expect(httpsCallable).toHaveBeenCalledWith("joinHousehold");
    expect(mockCallable).toHaveBeenCalledWith({ code: "K7PX-M3QH", preview: true });
  });

  it("joins with a code", async () => {
    mockCallable.mockResolvedValue({ data: { householdId: "h", householdName: "The Flat" } });

    await joinHousehold("K7PX-M3QH");
    expect(mockCallable).toHaveBeenCalledWith({ code: "K7PX-M3QH" });
  });

  it("formats a code", () => {
    expect(formatInviteCode("K7PXM3QH")).toBe("K7PX-M3QH");
  });
});

describe("joinErrorMessage", () => {
  it.each([
    ["invalid-argument", "Codes are 8 letters and numbers."],
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
