import { Alert, Share } from "react-native";

import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import { HouseholdContext } from "@/context/household/HouseholdProvider";
import {
  createInvite,
  joinHousehold,
  previewInvite,
} from "@/helpers/household/invites";
import {
  leaveHousehold,
  removeMember,
} from "@/helpers/household/membership";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockHousehold, mockHouseholdContext } from "@/test-utils/MockHousehold";

import HouseholdCard from "./HouseholdCard";

jest.mock("@/helpers/household/invites", () => ({
  ...jest.requireActual("@/helpers/household/invites"),
  createInvite: jest.fn(),
  previewInvite: jest.fn(),
  joinHousehold: jest.fn(),
}));

jest.mock("@/helpers/household/membership", () => ({
  ...jest.requireActual("@/helpers/household/membership"),
  leaveHousehold: jest.fn(),
  removeMember: jest.fn(),
}));

const renderCard = (household = mockHousehold) =>
  render(
    <AuthContext.Provider value={{ ...mockAuthContextValue, user: mockUser }}>
      <HouseholdContext.Provider value={mockHouseholdContext({ household })}>
        <HouseholdCard />
      </HouseholdContext.Provider>
    </AuthContext.Provider>,
  );

// Pressing a button in the last Alert.alert call.
const pressAlertButton = (text: string) => {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
  buttons.find((b) => b.text === text)?.onPress?.();
};

const openJoinForm = (code = "k7px m3qh") => {
  fireEvent.press(screen.getByLabelText("Join a household"));
  fireEvent.changeText(screen.getByLabelText("Invite code"), code);
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("HouseholdCard", () => {
  it("shows the name and members, marking you", () => {
    renderCard();

    expect(screen.getByText("The Flat")).toBeVisible();
    expect(screen.getByText("Kian (you)")).toBeVisible();
    expect(screen.getByText("Sam")).toBeVisible();
  });

  it("creates an invite and shares it", async () => {
    jest.mocked(createInvite).mockResolvedValue({
      code: "K7PXM3QH",
      expiresAt: new Date(2026, 10, 22).getTime(),
      householdName: "The Flat",
    });
    renderCard();

    fireEvent.press(screen.getByLabelText("Invite housemate"));

    await waitFor(() => expect(Share.share).toHaveBeenCalledTimes(1));
    expect(Share.share).toHaveBeenCalledWith({
      message:
        "Join my household on Plant Friends. Open Profile, tap Join a household and enter this code: K7PX-M3QH. It works until 22 November.",
    });
  });

  it("hides the invite button when the household is full", () => {
    const ids = Array.from({ length: 10 }, (_, i) => `u${i}`);
    renderCard({
      ...mockHousehold,
      memberIds: ids,
      members: Object.fromEntries(ids.map((id) => [id, { displayName: id }])),
    });

    expect(screen.queryByLabelText("Invite housemate")).toBeNull();
  });

  it("previews, confirms, then joins", async () => {
    jest.mocked(previewInvite).mockResolvedValue({
      householdName: "The Flat",
      memberCount: 2,
      plantsMoving: 3,
    });
    jest.mocked(joinHousehold).mockResolvedValue({
      householdId: "h1",
      householdName: "The Flat",
    });
    renderCard();
    openJoinForm();

    fireEvent.press(screen.getByLabelText("Continue"));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(previewInvite).toHaveBeenCalledWith("k7px m3qh");
    expect(Alert.alert).toHaveBeenCalledWith(
      "Join The Flat?",
      "Your 3 plants will move with you. You'll see the plants this household shares.",
      expect.any(Array),
    );
    expect(joinHousehold).not.toHaveBeenCalled();

    pressAlertButton("Join");

    await waitFor(() => expect(joinHousehold).toHaveBeenCalledWith("k7px m3qh"));
    await waitFor(() => expect(screen.queryByLabelText("Invite code")).toBeNull());
  });

  it("leaves out the plants line when none are moving", async () => {
    jest.mocked(previewInvite).mockResolvedValue({
      householdName: "The Flat",
      memberCount: 2,
      plantsMoving: 0,
    });
    renderCard();
    openJoinForm();

    fireEvent.press(screen.getByLabelText("Continue"));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(Alert.alert).toHaveBeenCalledWith(
      "Join The Flat?",
      "You'll see the plants this household shares.",
      expect.any(Array),
    );
  });

  it("doesn't join when the alert is cancelled", async () => {
    jest.mocked(previewInvite).mockResolvedValue({
      householdName: "The Flat",
      memberCount: 2,
      plantsMoving: 1,
    });
    renderCard();
    openJoinForm();

    fireEvent.press(screen.getByLabelText("Continue"));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    pressAlertButton("Cancel");

    expect(joinHousehold).not.toHaveBeenCalled();
  });

  it.each([
    ["not-found", "That code isn't valid or has expired."],
    ["already-exists", "You're already in this household."],
    ["failed-precondition", "Leave your current household first."],
    ["resource-exhausted", "This household is full."],
    ["invalid-argument", "Codes are 8 letters and numbers."],
    ["internal", "Couldn't join. Check your connection and try again."],
  ])("shows the message for %s", async (code, message) => {
    jest.mocked(previewInvite).mockRejectedValue({ code });
    renderCard();
    openJoinForm();

    fireEvent.press(screen.getByLabelText("Continue"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Join a household",
        message,
        expect.any(Array),
      ),
    );
  });

  it("shows a message when the join itself fails", async () => {
    jest.mocked(previewInvite).mockResolvedValue({
      householdName: "The Flat",
      memberCount: 2,
      plantsMoving: 0,
    });
    jest.mocked(joinHousehold).mockRejectedValue({ code: "functions/resource-exhausted" });
    renderCard();
    openJoinForm();

    fireEvent.press(screen.getByLabelText("Continue"));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    pressAlertButton("Join");

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenLastCalledWith(
        "Join a household",
        "This household is full.",
        expect.any(Array),
      ),
    );
  });

  describe("leaving", () => {
    it("asks first, then leaves", async () => {
      jest.mocked(leaveHousehold).mockResolvedValue();
      renderCard();

      fireEvent.press(screen.getByLabelText("Leave household"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Leave The Flat?",
        "Plants only you look after will stay with the household. You'll get a household of your own.",
        expect.any(Array),
      );
      expect(leaveHousehold).not.toHaveBeenCalled();

      pressAlertButton("Leave");
      await waitFor(() => expect(leaveHousehold).toHaveBeenCalledTimes(1));
    });

    it("doesn't leave when the alert is cancelled", () => {
      renderCard();

      fireEvent.press(screen.getByLabelText("Leave household"));
      pressAlertButton("Cancel");

      expect(leaveHousehold).not.toHaveBeenCalled();
    });

    it("is hidden when you're the only member", () => {
      renderCard({
        ...mockHousehold,
        memberIds: ["user1"],
        members: { user1: { displayName: "Kian" } },
      });

      expect(screen.queryByLabelText("Leave household")).toBeNull();
    });

    it("shows a message when it fails", async () => {
      jest.mocked(leaveHousehold).mockRejectedValue({ code: "failed-precondition" });
      renderCard();

      fireEvent.press(screen.getByLabelText("Leave household"));
      pressAlertButton("Leave");

      await waitFor(() =>
        expect(Alert.alert).toHaveBeenLastCalledWith(
          "Leave household",
          "You're the only member of this household.",
          expect.any(Array),
        ),
      );
    });
  });

  describe("removing a member", () => {
    it("lets the creator remove a housemate after a confirmation", async () => {
      jest.mocked(removeMember).mockResolvedValue();
      renderCard(); // mockHousehold.createdBy is user1, the signed-in user

      expect(screen.queryByLabelText("Remove Kian")).toBeNull();
      fireEvent.press(screen.getByLabelText("Remove Sam"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Remove Sam from The Flat?",
        "Plants only Sam looks after will stay with the household.",
        expect.any(Array),
      );
      expect(removeMember).not.toHaveBeenCalled();

      pressAlertButton("Remove");
      await waitFor(() => expect(removeMember).toHaveBeenCalledWith("user2"));
    });

    it("doesn't remove when the alert is cancelled", () => {
      renderCard();

      fireEvent.press(screen.getByLabelText("Remove Sam"));
      pressAlertButton("Cancel");

      expect(removeMember).not.toHaveBeenCalled();
    });

    it("shows no remove buttons to anyone but the creator", () => {
      renderCard({ ...mockHousehold, createdBy: "user2" });

      expect(screen.queryByLabelText("Remove Sam")).toBeNull();
      expect(screen.queryByLabelText("Remove Kian")).toBeNull();
    });

    it("shows a message when it fails", async () => {
      jest.mocked(removeMember).mockRejectedValue({ code: "not-found" });
      renderCard();

      fireEvent.press(screen.getByLabelText("Remove Sam"));
      pressAlertButton("Remove");

      await waitFor(() =>
        expect(Alert.alert).toHaveBeenLastCalledWith(
          "Remove member",
          "That person isn't in this household.",
          expect.any(Array),
        ),
      );
    });
  });
});
