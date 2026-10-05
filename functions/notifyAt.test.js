const { nextAllowedTime } = require("./notifyAt");

describe("nextAllowedTime", () => {
  it("leaves a daytime time alone", () => {
    const noon = Date.parse("2026-10-05T11:00:00Z"); // 12:00 in London (BST)
    expect(nextAllowedTime(noon, "Europe/London")).toBe(noon);
  });

  it("moves an overnight time to 08:00 local", () => {
    const night = Date.parse("2026-10-06T01:30:00Z"); // 02:30 BST
    expect(new Date(nextAllowedTime(night, "Europe/London")).toISOString()).toBe(
      "2026-10-06T07:00:00.000Z", // 08:00 BST
    );
  });

  it("moves a late-evening time to 08:00 the next day", () => {
    const evening = Date.parse("2026-10-05T20:10:00Z"); // 21:10 BST
    expect(new Date(nextAllowedTime(evening, "Europe/London")).toISOString()).toBe(
      "2026-10-06T07:00:00.000Z",
    );
  });

  it("handles half-hour offsets", () => {
    const night = Date.parse("2026-10-05T20:00:00Z"); // 01:30 in Kolkata (+05:30)
    expect(new Date(nextAllowedTime(night, "Asia/Kolkata")).toISOString()).toBe(
      "2026-10-06T02:30:00.000Z", // 08:00 IST
    );
  });

  it("uses the new offset on the morning clocks go back", () => {
    const night = Date.parse("2026-10-25T03:00:00Z"); // 03:00 GMT, after the change
    expect(new Date(nextAllowedTime(night, "Europe/London")).toISOString()).toBe(
      "2026-10-25T08:00:00.000Z", // 08:00 GMT
    );
  });

  it("falls back to UTC for an unknown time zone", () => {
    const night = Date.parse("2026-10-05T23:00:00Z");
    expect(new Date(nextAllowedTime(night, "Not/AZone")).toISOString()).toBe(
      "2026-10-06T08:00:00.000Z",
    );
  });
});
