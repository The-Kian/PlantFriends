import functions from "@react-native-firebase/functions";

export interface CreatedInvite {
  code: string;
  /** Milliseconds since the epoch. */
  expiresAt: number;
  householdName: string;
}

export interface InvitePreview {
  householdName: string;
  memberCount: number;
  plantsMoving: number;
}

/** Makes a new invite code for the signed-in user's household. */
export async function createInvite(): Promise<CreatedInvite> {
  const callable = functions().httpsCallable<undefined, CreatedInvite>(
    "createInvite",
  );
  const result = await callable();
  return result.data;
}

/** Checks a code and says which household it's for, without joining. */
export async function previewInvite(code: string): Promise<InvitePreview> {
  const callable = functions().httpsCallable<
    { code: string; preview: boolean },
    InvitePreview
  >("joinHousehold");
  const result = await callable({ code, preview: true });
  return result.data;
}

/** Joins the household the code is for. */
export async function joinHousehold(
  code: string,
): Promise<{ householdId: string; householdName: string }> {
  const callable = functions().httpsCallable<
    { code: string },
    { householdId: string; householdName: string }
  >("joinHousehold");
  const result = await callable({ code });
  return result.data;
}

/** "K7PXM3QH" becomes "K7PX-M3QH". */
export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

const MESSAGES: Record<string, string> = {
  "invalid-argument": "Codes are 8 letters and numbers.",
  "not-found": "That code isn't valid or has expired.",
  "already-exists": "You're already in this household.",
  "failed-precondition": "Leave your current household first.",
  "resource-exhausted": "This household is full.",
};

/**
 * A friendly message for a failed invite call. The installed
 * @react-native-firebase/functions reports codes like "not-found"; other
 * versions say "functions/not-found", so both are accepted.
 */
export function joinErrorMessage(
  error: unknown,
  fallback = "Couldn't join. Check your connection and try again.",
): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code).replace(/^functions\//, "")
      : "";
  return MESSAGES[code] ?? fallback;
}
