import { IUserPlant } from "@/constants/IPlant";

import { canEditPlant, canRemovePlant } from "./permissions";

const plant = (extra: Partial<IUserPlant> = {}): IUserPlant =>
  ({
    id: "p1",
    addedBy: "alice",
    carerIds: ["alice"],
    shared: false,
    ...extra,
  }) as IUserPlant;

describe("plant permissions", () => {
  it("the owner can edit and remove their personal plant", () => {
    expect(canEditPlant(plant(), "alice")).toBe(true);
    expect(canRemovePlant(plant(), "alice")).toBe(true);
  });

  it("a housemate can't edit or remove someone's personal plant", () => {
    expect(canEditPlant(plant(), "bob")).toBe(false);
    expect(canRemovePlant(plant(), "bob")).toBe(false);
  });

  it("a carer of a shared plant can do both", () => {
    const shared = plant({ shared: true, carerIds: ["alice", "bob"] });
    expect(canEditPlant(shared, "bob")).toBe(true);
    expect(canRemovePlant(shared, "bob")).toBe(true);
  });

  it("any member can remove a shared plant, but only a carer can edit it", () => {
    const shared = plant({ shared: true, carerIds: ["alice"] });
    expect(canRemovePlant(shared, "bob")).toBe(true);
    expect(canEditPlant(shared, "bob")).toBe(false);
  });

  it("treats a plant with no owner as anyone's, and nobody signed in as no one", () => {
    const old = plant({ addedBy: undefined, carerIds: [] });
    expect(canEditPlant(old, "bob")).toBe(true);
    expect(canRemovePlant(plant(), undefined)).toBe(false);
  });
});
