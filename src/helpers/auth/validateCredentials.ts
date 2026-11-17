import { CredentialsType } from "@/context/auth/AuthTypes";

// Firebase Auth's own minimum.
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Checks the auth form. `message` says what to fix, so the user isn't left
 * guessing which field is wrong.
 */
function validateCredentials(
  credentials: CredentialsType,
  authScreenType: string,
): { isValid: boolean; message?: string } {
  let { email, password } = credentials;
  const { confirmEmail, confirmPassword } = credentials;

  email = email.trim();
  password = password.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isValid: false, message: "Enter a valid email address." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Passwords are at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (authScreenType === "signUp") {
    if (email !== confirmEmail?.trim()) {
      return { isValid: false, message: "The two email addresses don't match." };
    }
    if (password !== confirmPassword?.trim()) {
      return { isValid: false, message: "The two passwords don't match." };
    }
  }
  return { isValid: true };
}

export default validateCredentials;
