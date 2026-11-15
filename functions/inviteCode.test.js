const { ALPHABET, generateCode, normaliseCode } = require("./inviteCode");

describe("generateCode", () => {
  it("makes 8 characters from the alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode();
      expect(code).toHaveLength(8);
      expect([...code].every((c) => ALPHABET.includes(c))).toBe(true);
    }
  });

  it("leaves out look-alike characters", () => {
    expect(ALPHABET).toHaveLength(31);
    for (const c of "ILO01") expect(ALPHABET).not.toContain(c);
  });
});

describe("normaliseCode", () => {
  it("accepts lower case, spaces and hyphens", () => {
    expect(normaliseCode("k7px m3qh")).toBe("K7PXM3QH");
    expect(normaliseCode("K7PX-M3QH")).toBe("K7PXM3QH");
    expect(normaliseCode("  k7px-m3qh ")).toBe("K7PXM3QH");
  });

  it("rejects the wrong length", () => {
    expect(normaliseCode("K7PXM3Q")).toBeNull();
    expect(normaliseCode("K7PXM3QHH")).toBeNull();
    expect(normaliseCode("")).toBeNull();
  });

  it("rejects look-alike characters", () => {
    for (const c of "ILO01") {
      expect(normaliseCode(`K7PXM3Q${c}`)).toBeNull();
    }
  });

  it("rejects anything that isn't a string", () => {
    expect(normaliseCode(undefined)).toBeNull();
    expect(normaliseCode(12345678)).toBeNull();
    expect(normaliseCode(null)).toBeNull();
  });
});
