const {
  DAY_MS,
  isWatering,
  wateredMessages,
  reminderMessage,
  planAfterWrite,
  planAfterSend,
} = require("./plantMessages");

const NOW = Date.parse("2026-10-05T10:00:00Z"); // a Monday, 11:00 in London
const TZ = "Europe/London";

const samsMonstera = {
  addedBy: "sam",
  carerIds: ["sam"],
  shared: false,
  last_watered_date: NOW,
  last_watered_by: "kian",
  last_watered_by_name: "Kian",
  next_watering_date: NOW + 3 * DAY_MS,
};

const sharedPothos = {
  addedBy: "kian",
  carerIds: ["kian", "sam"],
  shared: true,
  last_watered_date: NOW,
  last_watered_by: "kian",
  last_watered_by_name: "Kian",
  next_watering_date: NOW + 7 * DAY_MS,
};

const ids = { plantId: "p1", householdId: "h1", now: NOW, timeZone: TZ };

describe("isWatering", () => {
  it("is true only when the watering date changes", () => {
    const before = { ...samsMonstera, last_watered_date: NOW - DAY_MS };
    expect(isWatering(before, samsMonstera)).toBe(true);
    expect(isWatering(samsMonstera, { ...samsMonstera, custom_name: "Monty" })).toBe(false);
    expect(isWatering(null, samsMonstera)).toBe(false);
  });
});

describe("wateredMessages", () => {
  it("tells the owner when a housemate waters their plant", () => {
    const messages = wateredMessages({ plant: samsMonstera, name: "Monstera", ...ids });
    expect(messages).toEqual([
      {
        uids: ["sam"],
        message: {
          title: "Kian watered your Monstera 💧",
          body: "No need to water it. Next due Thu.",
          data: { plantId: "p1", householdId: "h1", type: "watered" },
        },
      },
    ]);
  });

  it("tells the other carers of a shared plant, not the person who watered it", () => {
    const messages = wateredMessages({ plant: sharedPothos, name: "Pothos", ...ids });
    expect(messages).toHaveLength(1);
    expect(messages[0].uids).toEqual(["sam"]);
    expect(messages[0].message.title).toBe("Kian watered the Pothos 💧");
  });

  it("sends nothing when you water a plant only you look after", () => {
    const own = { ...samsMonstera, addedBy: "kian", carerIds: ["kian"] };
    expect(wateredMessages({ plant: own, name: "Cactus", ...ids })).toEqual([]);
  });
});

describe("reminderMessage", () => {
  it("words a shared reminder for whoever gets there first", () => {
    const plant = { ...sharedPothos, notify_stage: "due" };
    expect(reminderMessage({ plant, name: "Pothos", ...ids })).toMatchObject({
      title: "The Pothos needs watering 💧",
      body: "Whoever gets there first, tap Watered.",
      data: { type: "due" },
    });
  });

  it("words a personal reminder and a nudge", () => {
    const plant = { ...samsMonstera, notify_stage: "due" };
    expect(reminderMessage({ plant, name: "Monstera", ...ids }).title).toBe(
      "Time to water the Monstera 💧",
    );
    expect(
      reminderMessage({ plant: { ...plant, notify_stage: "nudge" }, name: "Monstera", ...ids })
        .title,
    ).toBe("The Monstera is still thirsty 💧");
  });
});

describe("planAfterWrite", () => {
  it("plans a reminder at the due time when watering moves the date", () => {
    const before = { ...samsMonstera, next_watering_date: NOW };
    expect(planAfterWrite(before, samsMonstera, NOW, TZ)).toEqual({
      notify_at: samsMonstera.next_watering_date,
      notify_stage: "due",
    });
  });

  it("does nothing when the due date didn't change, so its own write doesn't loop", () => {
    const after = { ...samsMonstera, notify_at: 1, notify_stage: "due" };
    expect(planAfterWrite(samsMonstera, after, NOW, TZ)).toBeNull();
  });

  it("holds a reminder that falls due overnight until 08:00", () => {
    const due = Date.parse("2026-10-08T01:30:00Z"); // 02:30 BST
    const after = { ...samsMonstera, next_watering_date: due };
    expect(new Date(planAfterWrite(samsMonstera, after, NOW, TZ).notify_at).toISOString()).toBe(
      "2026-10-08T07:00:00.000Z",
    );
  });

  it("clears the plan when reminders are turned off", () => {
    const before = { ...samsMonstera, notify_at: 5, notify_stage: "due" };
    const after = { ...before, reminders_enabled: false };
    expect(planAfterWrite(before, after, NOW, TZ)).toEqual({
      notify_at: null,
      notify_stage: null,
    });
  });

  it("sends one nudge for a plant that is long overdue", () => {
    const after = { ...samsMonstera, next_watering_date: NOW - 10 * DAY_MS };
    expect(planAfterWrite(null, after, NOW, TZ)).toEqual({
      notify_at: NOW,
      notify_stage: "nudge",
    });
  });
});

describe("planAfterSend", () => {
  it("plans one nudge a day after the reminder, then stops", () => {
    const plant = { ...samsMonstera, next_watering_date: NOW, notify_stage: "due" };
    expect(planAfterSend(plant, NOW, TZ)).toEqual({
      notify_at: NOW + DAY_MS,
      notify_stage: "nudge",
    });
    expect(planAfterSend({ ...plant, notify_stage: "nudge" }, NOW, TZ)).toEqual({
      notify_at: null,
      notify_stage: null,
    });
  });
});
