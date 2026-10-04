const { anonymiseUserPlant } = require("./anonymise");

describe("anonymiseUserPlant", () => {
  it("keeps structured plant data and drops identifying fields", () => {
    const result = anonymiseUserPlant({
      id: "user-plant-1",
      userId: "uid-123",
      plantId: "plant-1",
      custom_name: "Kian's fern",
      custom_notes: "Gift from mum",
      location: "12 Example Street",
      slug: "kian's fern",
      houseLocation: "Kitchen",
      date_added: 1,
      last_watered_date: 2,
      next_watering_date: 3,
      custom_watering_schedule: 7,
      reminders_enabled: true,
      is_favorite: false,
      custom_attributes: {
        name: "Typed by user",
        description: "Free text",
        watering_frequency: 5,
        temperature_minimum: 10,
      },
    });

    expect(result).toEqual({
      plantId: "plant-1",
      houseLocation: "Kitchen",
      date_added: 1,
      last_watered_date: 2,
      next_watering_date: 3,
      custom_watering_schedule: 7,
      reminders_enabled: true,
      is_favorite: false,
      custom_attributes: { watering_frequency: 5, temperature_minimum: 10 },
    });
  });

  it("omits custom_attributes when nothing in it is kept", () => {
    const result = anonymiseUserPlant({
      plantId: "plant-1",
      custom_attributes: { name: "Typed by user" },
    });

    expect(result).toEqual({ plantId: "plant-1" });
  });
});
