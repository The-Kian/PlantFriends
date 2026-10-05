const { plantUpdateOnLeave } = require("./leaveHousehold");

describe("plantUpdateOnLeave", () => {
  it("removes the leaver from a shared plant's carers", () => {
    const plant = { addedBy: "sam", carerIds: ["kian", "sam"], shared: true };
    expect(plantUpdateOnLeave(plant, "kian", ["sam"])).toEqual({ carerIds: ["sam"] });
  });

  it("hands a plant only they looked after to the household", () => {
    const plant = { addedBy: "kian", userId: "kian", carerIds: ["kian"], shared: false };
    expect(plantUpdateOnLeave(plant, "kian", ["sam", "alex"])).toEqual({
      carerIds: ["sam", "alex"],
      shared: true,
      addedBy: null,
      userId: null,
    });
  });

  it("removes their name from the last watering", () => {
    const plant = {
      addedBy: "sam",
      carerIds: ["sam"],
      last_watered_by: "kian",
      last_watered_by_name: "Kian",
    };
    expect(plantUpdateOnLeave(plant, "kian", ["sam"])).toEqual({
      last_watered_by: null,
      last_watered_by_name: null,
    });
  });

  it("leaves other people's plants alone", () => {
    const plant = { addedBy: "sam", carerIds: ["sam"], last_watered_by: "sam" };
    expect(plantUpdateOnLeave(plant, "kian", ["sam"])).toBeNull();
  });
});
