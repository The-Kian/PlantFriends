import { Alert } from "react-native";

import ErrorService, { alertTitleFor } from "./ErrorService";

jest.mock("./CrashReporting", () => ({ recordHandledError: jest.fn() }));

describe("ErrorService alert titles", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([
    ["Login", "Couldn't log in"],
    ["Save Plant", "Couldn't save the plant"],
    ["Fetch Plant By ID", "Couldn't load the plant"],
    ["Something we never listed", "Something went wrong"],
    [undefined, "Something went wrong"],
  ])("titles the %s context %s", (context, title) => {
    expect(alertTitleFor(context)).toBe(title);
  });

  it("shows the human title, not the context name", () => {
    ErrorService.handleError({ code: "auth/invalid-credential" }, "Login");

    expect(Alert.alert).toHaveBeenCalledWith(
      "Couldn't log in",
      expect.any(String),
      expect.anything()
    );
  });
});
