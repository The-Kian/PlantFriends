const { DAY_MS, plantName, isWatering, wateredMessages } = require("./plantMessages");

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
  carerIds: ["kian", "sam", "alex"],
  shared: true,
  last_watered_date: NOW,
  last_watered_by: "kian",
  last_watered_by_name: "Kian",
  next_watering_date: NOW + 10 * DAY_MS,
};

const ids = { plantId: "p1", householdId: "h1", now: NOW, timeZone: TZ };

describe("plantName", () => {
  it("prefers the person's own name for the plant, then the species", () => {
    expect(plantName({ custom_name: " Monty " }, "Monstera")).toBe("Monty");
    expect(plantName({}, "Monstera")).toBe("Monstera");
    expect(plantName({}, null)).toBe("plant");
  });
});

describe("isWatering", () => {
  it("is true only when the watering date changes", () => {
    const before = { ...samsMonstera, last_watered_date: NOW - DAY_MS };
    expect(isWatering(before, samsMonstera)).toBe(true);
    expect(isWatering(samsMonstera, { ...samsMonstera, custom_name: "Monty" })).toBe(false);
    expect(isWatering(null, samsMonstera)).toBe(false);
  });

  it("is false for a plant that arrives as a create, like one moved in by joinHousehold", () => {
    // A moved plant keeps its last watering, but must not send a "watered" push.
    expect(isWatering(null, samsMonstera)).toBe(false);
    expect(isWatering(undefined, samsMonstera)).toBe(false);
  });

  it("ignores a watering with nobody recorded", () => {
    const before = { ...samsMonstera, last_watered_date: NOW - DAY_MS };
    expect(isWatering(before, { ...samsMonstera, last_watered_by: null })).toBe(false);
  });
});

describe("wateredMessages", () => {
  it("tells the owner when a housemate waters their plant", () => {
    expect(wateredMessages({ plant: samsMonstera, name: "Monstera", ...ids })).toEqual([
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
    expect(messages[0].uids).toEqual(["sam", "alex"]);
    expect(messages[0].message.title).toBe("Kian watered the Pothos 💧");
    expect(messages[0].message.body).toBe("No need to water it. Next due 15 Oct.");
  });

  it("uses a nickname without \"the\" or \"your\"", () => {
    const monty = { ...sharedPothos, custom_name: "Monty" };
    const messages = wateredMessages({ plant: monty, name: "Monty", ...ids });
    expect(messages[0].message.title).toBe("Kian watered Monty 💧");
  });

  it("sends nothing when you water a plant only you look after", () => {
    const own = { ...samsMonstera, addedBy: "kian", carerIds: ["kian"] };
    expect(wateredMessages({ plant: own, name: "Cactus", ...ids })).toEqual([]);
  });

  it("leaves out the due date when there isn't a future one", () => {
    const plant = { ...samsMonstera, next_watering_date: null };
    expect(wateredMessages({ plant, name: "Monstera", ...ids })[0].message.body).toBe(
      "No need to water it.",
    );
  });
});

describe("reminderMessage", () => {
  const { reminderMessage } = require("./plantMessages");
  const ids = { plantId: "p1", householdId: "h1" };

  it("puts 'the' before a species name", () => {
    const plant = { shared: false };
    expect(reminderMessage({ plant, name: "Pothos", stage: "due", ...ids }).title).toBe(
      "Time to water the Pothos 💧",
    );
    expect(
      reminderMessage({ plant: { shared: true }, name: "Pothos", stage: "due", ...ids }).title,
    ).toBe("The Pothos needs watering 💧");
    expect(reminderMessage({ plant, name: "Pothos", stage: "nudge", ...ids }).title).toBe(
      "The Pothos is still thirsty 🥀",
    );
  });

  it("uses a nickname on its own", () => {
    const plant = { shared: true, custom_name: "Monty" };
    expect(reminderMessage({ plant, name: "Monty", stage: "due", ...ids }).title).toBe(
      "Monty needs watering 💧",
    );
    expect(reminderMessage({ plant, name: "Monty", stage: "nudge", ...ids }).title).toBe(
      "Monty is still thirsty 🥀",
    );
    expect(
      reminderMessage({ plant: { shared: false, custom_name: "Pip" }, name: "Pip", stage: "due", ...ids })
        .title,
    ).toBe("Time to water Pip 💧");
  });
});
