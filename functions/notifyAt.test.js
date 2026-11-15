const { notifyAt } = require("./notifyAt");

const at = (iso) => Date.parse(iso);
const iso = (ms) => new Date(ms).toISOString();

describe("notifyAt", () => {
  describe("in London in winter (UTC+0)", () => {
    const zone = "Europe/London";

    it.each([
      ["08:00 exactly", "2026-01-10T08:00:00Z"],
      ["the afternoon", "2026-01-10T14:30:00Z"],
      ["20:59", "2026-01-10T20:59:59Z"],
    ])("keeps %s", (_, time) => {
      expect(iso(notifyAt(at(time), zone))).toBe(new Date(time).toISOString());
    });

    it.each([
      ["21:00", "2026-01-10T21:00:00Z", "2026-01-11T08:00:00.000Z"],
      ["23:59", "2026-01-10T23:59:00Z", "2026-01-11T08:00:00.000Z"],
      ["midnight", "2026-01-11T00:00:00Z", "2026-01-11T08:00:00.000Z"],
      ["02:30", "2026-01-11T02:30:00Z", "2026-01-11T08:00:00.000Z"],
      ["07:59", "2026-01-11T07:59:00Z", "2026-01-11T08:00:00.000Z"],
    ])("moves %s to the next 08:00", (_, time, expected) => {
      expect(iso(notifyAt(at(time), zone))).toBe(expected);
    });

    it("moves New Year's Eve at 22:00 into the next year", () => {
      expect(iso(notifyAt(at("2026-12-31T22:00:00Z"), zone))).toBe("2027-01-01T08:00:00.000Z");
    });
  });

  describe("around the clocks going forward (London, 29 March 2026)", () => {
    const zone = "Europe/London";

    it("moves 23:00 GMT the night before to 08:00 BST", () => {
      expect(iso(notifyAt(at("2026-03-28T23:00:00Z"), zone))).toBe("2026-03-29T07:00:00.000Z");
    });

    it("moves 00:30 GMT, just before the change, to 08:00 BST", () => {
      // 00:30Z is 00:30 GMT; the clocks jump at 01:00Z.
      expect(iso(notifyAt(at("2026-03-29T00:30:00Z"), zone))).toBe("2026-03-29T07:00:00.000Z");
    });

    it("keeps 08:00 BST", () => {
      expect(iso(notifyAt(at("2026-03-29T07:00:00Z"), zone))).toBe("2026-03-29T07:00:00.000Z");
    });

    it("treats 07:30 GMT (08:30 BST) as daytime", () => {
      expect(iso(notifyAt(at("2026-03-29T07:30:00Z"), zone))).toBe("2026-03-29T07:30:00.000Z");
    });
  });

  describe("around the clocks going back (London, 25 October 2026)", () => {
    const zone = "Europe/London";

    it("moves 22:00 BST the night before to 08:00 GMT", () => {
      expect(iso(notifyAt(at("2026-10-24T21:00:00Z"), zone))).toBe("2026-10-25T08:00:00.000Z");
    });

    it("moves the repeated 01:30 hour to 08:00 GMT", () => {
      expect(iso(notifyAt(at("2026-10-25T00:30:00Z"), zone))).toBe("2026-10-25T08:00:00.000Z");
      expect(iso(notifyAt(at("2026-10-25T01:30:00Z"), zone))).toBe("2026-10-25T08:00:00.000Z");
    });

    it("treats 07:30 GMT on the day the clocks go back as still quiet", () => {
      expect(iso(notifyAt(at("2026-10-25T07:30:00Z"), zone))).toBe("2026-10-25T08:00:00.000Z");
    });
  });

  describe("in other zones", () => {
    it("uses the household's zone, not UTC (New York, UTC-5)", () => {
      // 02:00Z is 21:00 the evening before in New York.
      expect(iso(notifyAt(at("2026-01-11T02:00:00Z"), "America/New_York"))).toBe(
        "2026-01-11T13:00:00.000Z",
      );
      // 14:00Z is 09:00 in New York: daytime.
      expect(iso(notifyAt(at("2026-01-11T14:00:00Z"), "America/New_York"))).toBe(
        "2026-01-11T14:00:00.000Z",
      );
    });

    it("works ahead of UTC across midnight UTC (Tokyo, UTC+9)", () => {
      // 13:00Z is 22:00 in Tokyo; the next 08:00 there is 23:00Z.
      expect(iso(notifyAt(at("2026-01-10T13:00:00Z"), "Asia/Tokyo"))).toBe(
        "2026-01-10T23:00:00.000Z",
      );
    });

    it("handles a half-hour offset (Kolkata, UTC+5:30)", () => {
      // 17:00Z is 22:30 in Kolkata; 08:00 there is 02:30Z.
      expect(iso(notifyAt(at("2026-01-10T17:00:00Z"), "Asia/Kolkata"))).toBe(
        "2026-01-11T02:30:00.000Z",
      );
    });

    it.each([undefined, null, "", "Not/AZone"])("falls back to UTC for %p", (zone) => {
      expect(iso(notifyAt(at("2026-01-10T23:00:00Z"), zone))).toBe("2026-01-11T08:00:00.000Z");
    });
  });
});
