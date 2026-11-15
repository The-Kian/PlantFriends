const { notifyAt, planReminder } = require("./notifyAt");

const LONDON = "Europe/London";
const iso = (ms) => new Date(ms).toISOString();

describe("notifyAt", () => {
  it("leaves daytime alone", () => {
    const due = Date.parse("2026-10-05T10:00:00Z"); // 11:00 in London (BST)
    expect(notifyAt(due, LONDON)).toBe(due);
  });

  it("holds the boundaries: 08:00 goes out, 21:00 waits", () => {
    const eight = Date.parse("2026-01-12T08:00:00Z"); // GMT
    expect(notifyAt(eight, LONDON)).toBe(eight);
    const justBefore = Date.parse("2026-01-12T20:59:59Z");
    expect(notifyAt(justBefore, LONDON)).toBe(justBefore);
    expect(iso(notifyAt(Date.parse("2026-01-12T21:00:00Z"), LONDON))).toBe("2026-01-13T08:00:00.000Z");
  });

  it("moves an early-morning time to 08:00 the same day", () => {
    // 02:30 in London (GMT)
    expect(iso(notifyAt(Date.parse("2026-01-12T02:30:00Z"), LONDON))).toBe("2026-01-12T08:00:00.000Z");
  });

  it("moves an evening time to 08:00 the next day, across midnight and month ends", () => {
    expect(iso(notifyAt(Date.parse("2026-01-12T23:59:00Z"), LONDON))).toBe("2026-01-13T08:00:00.000Z");
    expect(iso(notifyAt(Date.parse("2026-01-12T00:00:00Z"), LONDON))).toBe("2026-01-12T08:00:00.000Z");
    expect(iso(notifyAt(Date.parse("2026-01-31T22:00:00Z"), LONDON))).toBe("2026-02-01T08:00:00.000Z");
  });

  it("uses the household's time zone, not UTC", () => {
    // 22:00 UTC is 07:00 the next day in Tokyo (UTC+9): quiet, so 08:00 Tokyo = 23:00 UTC.
    expect(iso(notifyAt(Date.parse("2026-01-12T22:00:00Z"), "Asia/Tokyo"))).toBe("2026-01-12T23:00:00.000Z");
    // 02:30 in New York (EST, UTC-5) is 07:30 UTC: 08:00 New York = 13:00 UTC.
    expect(iso(notifyAt(Date.parse("2026-01-12T07:30:00Z"), "America/New_York"))).toBe("2026-01-12T13:00:00.000Z");
  });

  it("gets 08:00 right when the clocks change overnight", () => {
    // UK clocks go forward on 2026-03-29 at 01:00 UTC. 23:30 on the 28th (GMT)
    // waits for 08:00 on the 29th, which is BST: 07:00 UTC.
    expect(iso(notifyAt(Date.parse("2026-03-28T23:30:00Z"), LONDON))).toBe("2026-03-29T07:00:00.000Z");
    // 02:30 BST on the 29th is 01:30 UTC: 08:00 BST = 07:00 UTC.
    expect(iso(notifyAt(Date.parse("2026-03-29T01:30:00Z"), LONDON))).toBe("2026-03-29T07:00:00.000Z");
    // Clocks go back on 2026-10-25 at 01:00 UTC: 22:00 BST on the 24th (21:00 UTC)
    // waits for 08:00 GMT on the 25th: 08:00 UTC.
    expect(iso(notifyAt(Date.parse("2026-10-24T21:00:00Z"), LONDON))).toBe("2026-10-25T08:00:00.000Z");
    // The repeated hour: 01:30 GMT on the 25th is still quiet.
    expect(iso(notifyAt(Date.parse("2026-10-25T01:30:00Z"), LONDON))).toBe("2026-10-25T08:00:00.000Z");
  });

  it("falls back to UTC for an unknown time zone", () => {
    expect(iso(notifyAt(Date.parse("2026-01-12T02:30:00Z"), "Not/AZone"))).toBe("2026-01-12T08:00:00.000Z");
    expect(iso(notifyAt(Date.parse("2026-01-12T02:30:00Z"), undefined))).toBe("2026-01-12T08:00:00.000Z");
  });
});

describe("planReminder", () => {
  const due = Date.parse("2026-10-05T10:00:00Z");
  const plant = { next_watering_date: due, reminders_enabled: true };

  it("plans a due reminder for a new plant", () => {
    expect(planReminder({ before: null, after: plant, timeZone: LONDON })).toEqual({
      notify_at: due,
      notify_stage: "due",
    });
  });

  it("moves an overnight due time to 08:00", () => {
    const night = { next_watering_date: Date.parse("2026-01-12T02:30:00Z") };
    expect(iso(planReminder({ before: null, after: night, timeZone: LONDON }).notify_at)).toBe(
      "2026-01-12T08:00:00.000Z",
    );
  });

  it("replans when the due date changes, such as after watering", () => {
    const watered = { ...plant, next_watering_date: due + 7 * 86400000, notify_at: due, notify_stage: "nudge" };
    expect(planReminder({ before: plant, after: watered, timeZone: LONDON })).toEqual({
      notify_at: due + 7 * 86400000,
      notify_stage: "due",
    });
  });

  it("clears the plan when reminders are switched off or there's no due date", () => {
    const planned = { ...plant, notify_at: due, notify_stage: "due" };
    expect(
      planReminder({ before: planned, after: { ...planned, reminders_enabled: false }, timeZone: LONDON }),
    ).toEqual({ notify_at: null, notify_stage: null });
    expect(
      planReminder({ before: planned, after: { ...planned, next_watering_date: null }, timeZone: LONDON }),
    ).toEqual({ notify_at: null, notify_stage: null });
  });

  it("ignores its own write, so it can't loop", () => {
    const before = { ...plant };
    const after = { ...plant, notify_at: due, notify_stage: "due" };
    expect(planReminder({ before, after, timeZone: LONDON })).toBeNull();
  });

  it("ignores edits that don't touch the due date or the switch", () => {
    const planned = { ...plant, notify_at: due, notify_stage: "due" };
    expect(planReminder({ before: planned, after: { ...planned, custom_name: "Monty" }, timeZone: LONDON })).toBeNull();
  });

  it("does nothing when the plan is already right", () => {
    const planned = { ...plant, notify_at: due, notify_stage: "due" };
    expect(planReminder({ before: null, after: planned, timeZone: LONDON })).toBeNull();
  });

  it("does nothing for a deleted plant", () => {
    expect(planReminder({ before: plant, after: null, timeZone: LONDON })).toBeNull();
  });
});
