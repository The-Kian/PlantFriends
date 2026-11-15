import functions from "@react-native-firebase/functions";

import {
  leaveHousehold,
  memberErrorMessage,
  removeMember,
} from "./membership";

const mockCallable = jest.fn();
const httpsCallable = (
  functions as unknown as { _mockHttpsCallable: jest.Mock }
)._mockHttpsCallable;

beforeEach(() => {
  mockCallable.mockReset();
  httpsCallable.mockReset();
  httpsCallable.mockReturnValue(mockCallable);
});

describe("membership", () => {
  it("leaves the household", async () => {
    mockCallable.mockResolvedValue({ data: { left: true } });

    await leaveHousehold();

    expect(httpsCallable).toHaveBeenCalledWith("leaveHousehold");
    expect(mockCallable).toHaveBeenCalledWith();
  });

  it("removes a member", async () => {
    mockCallable.mockResolvedValue({ data: { removed: true } });

    await removeMember("user2");

    expect(httpsCallable).toHaveBeenCalledWith("removeMember");
    expect(mockCallable).toHaveBeenCalledWith({ uid: "user2" });
  });

  it("passes server errors on", async () => {
    mockCallable.mockRejectedValue({ code: "permission-denied" });
    await expect(removeMember("user2")).rejects.toEqual({
      code: "permission-denied",
    });
  });
});

describe("memberErrorMessage", () => {
  it.each([
    ["failed-precondition", "You're the only member of this household."],
    [
      "functions/permission-denied",
      "You can't do that. Only the person who made this household can remove people.",
    ],
    ["not-found", "That person isn't in this household."],
    ["internal", "Couldn't do that. Check your connection and try again."],
  ])("maps %s", (code, message) => {
    expect(memberErrorMessage({ code })).toBe(message);
  });

  it("falls back for anything else", () => {
    const fallback = "Couldn't do that. Check your connection and try again.";
    expect(memberErrorMessage(new Error("boom"))).toBe(fallback);
    expect(memberErrorMessage(undefined)).toBe(fallback);
  });
});
