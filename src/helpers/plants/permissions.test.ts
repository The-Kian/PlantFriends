import { mockUserPlant } from "@/test-utils/MockPlant";

import { canEditPlant, canRemovePlant, isCarer } from "./permissions";

describe("plant permissions", () => {
  const personal = {
    ...mockUserPlant,
    addedBy: "a",
    carerIds: ["a"],
    shared: false,
  };
  const shared = { ...personal, carerIds: ["a", "b"], shared: true };

  it("lets the adder and carers edit and remove", () => {
    expect(isCarer(personal, "a")).toBe(true);
    expect(canEditPlant(personal, "a")).toBe(true);
    expect(canRemovePlant(personal, "a")).toBe(true);
    expect(canEditPlant(shared, "b")).toBe(true);
  });

  it("keeps a housemate's personal plant theirs", () => {
    expect(canEditPlant(personal, "b")).toBe(false);
    expect(canRemovePlant(personal, "b")).toBe(false);
  });

  it("lets any member remove a shared plant without being a carer", () => {
    const notCarer = { ...shared, carerIds: ["a"] };
    expect(canEditPlant(notCarer, "c")).toBe(false);
    expect(canRemovePlant(notCarer, "c")).toBe(true);
  });

  it("allows nothing when signed out", () => {
    expect(canEditPlant(personal, undefined)).toBe(false);
    expect(canRemovePlant(shared, undefined)).toBe(false);
  });
});
