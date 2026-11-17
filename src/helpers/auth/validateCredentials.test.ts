import { CredentialsType } from "@/context/auth/AuthTypes";

import validateCredentials from "./validateCredentials";

describe("validateCredentials", () => {
  it("should return true for valid login credentials", () => {
    const credentials: CredentialsType = {
      email: "test@example.com",
      confirmEmail: "",
      password: "password123",
      confirmPassword: "",
      displayName: "",
    };
    const result = validateCredentials(credentials, "login");
    expect(result.isValid).toBe(true);
  });

  it("should return false for invalid email in login", () => {
    const credentials: CredentialsType = {
      email: "testexample.com",
      confirmEmail: "",
      password: "password123",
      confirmPassword: "",
      displayName: "",
    };
    const result = validateCredentials(credentials, "login");
    expect(result.isValid).toBe(false);
  });

  it("should return false for short password in login", () => {
    const credentials: CredentialsType = {
      email: "test@example.com",
      confirmEmail: "",
      password: "pass",
      confirmPassword: "",
      displayName: "",
    };
    const result = validateCredentials(credentials, "login");
    expect(result.isValid).toBe(false);
  });

  it("should return true for valid signUp credentials", () => {
    const credentials: CredentialsType = {
      email: "test@example.com",
      confirmEmail: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
      displayName: "",
    };
    const result = validateCredentials(credentials, "signUp");
    expect(result.isValid).toBe(true);
  });

  it("should return false for mismatched emails in signUp", () => {
    const credentials: CredentialsType = {
      email: "test@example.com",
      confirmEmail: "test2@example.com",
      password: "password123",
      confirmPassword: "password123",
      displayName: "",
    };
    const result = validateCredentials(credentials, "signUp");
    expect(result.isValid).toBe(false);
  });

  it("should return false for mismatched passwords in signUp", () => {
    const credentials: CredentialsType = {
      email: "test@example.com",
      confirmEmail: "test@example.com",
      password: "password123",
      confirmPassword: "password456",
      displayName: "",
    };
    const result = validateCredentials(credentials, "signUp");
    expect(result.isValid).toBe(false);
  });
});

describe("validateCredentials messages", () => {
  const base = {
    email: "test@example.com",
    confirmEmail: "test@example.com",
    password: "secret",
    confirmPassword: "secret",
    displayName: "",
  };

  it("accepts a 6-character password, Firebase's minimum", () => {
    expect(validateCredentials(base, "login").isValid).toBe(true);
    expect(validateCredentials(base, "signUp").isValid).toBe(true);
  });

  it("says which field is wrong", () => {
    expect(validateCredentials({ ...base, email: "nope" }, "login").message).toBe(
      "Enter a valid email address.",
    );
    expect(
      validateCredentials({ ...base, password: "short" }, "login").message,
    ).toBe("Passwords are at least 6 characters.");
    expect(
      validateCredentials({ ...base, confirmEmail: "x@example.com" }, "signUp")
        .message,
    ).toBe("The two email addresses don't match.");
    expect(
      validateCredentials({ ...base, confirmPassword: "secret2" }, "signUp")
        .message,
    ).toBe("The two passwords don't match.");
  });
});
