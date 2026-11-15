/**
 * Invite codes: 8 characters people can read out or type. No I, L, O, 0 or 1,
 * which look like each other.
 */
const crypto = require("crypto");

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** A new random code, picked with a secure random source. */
function generateCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

/**
 * What someone typed, as a code: upper case, without spaces or hyphens.
 * Returns null if it isn't a valid code.
 */
function normaliseCode(input) {
  if (typeof input !== "string") return null;
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== CODE_LENGTH) return null;
  return [...code].every((c) => ALPHABET.includes(c)) ? code : null;
}

module.exports = { ALPHABET, CODE_LENGTH, generateCode, normaliseCode };
