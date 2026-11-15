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

/** Leaves the household for an empty one of your own. */
export async function leaveHousehold(): Promise<{ householdId: string }> {
  const callable = functions().httpsCallable<undefined, { householdId: string }>(
    "leaveHousehold",
  );
  const result = await callable();
  return result.data;
}

/** Takes a member out of the household. Only its creator may. */
export async function removeMember(
  uid: string,
): Promise<{ householdId: string }> {
  const callable = functions().httpsCallable<
    { uid: string },
    { householdId: string }
  >("removeMember");
  const result = await callable({ uid });
  return result.data;
}

/** "K7PXM3QH" becomes "K7PX-M3QH". */
export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

const JOIN_MESSAGES: Record<string, string> = {
  "invalid-argument": "Codes are 8 letters and numbers.",
  "not-found": "That code isn't valid or has expired.",
  "already-exists": "You're already in this household.",
  "failed-precondition": "Leave your current household first.",
  "resource-exhausted": "This household is full.",
};

const LEAVE_MESSAGES: Record<string, string> = {
  "failed-precondition": "You're the only one in this household.",
  "permission-denied":
    "Only the person who set up the household can remove people.",
  "not-found": "They're not in this household any more.",
};

/**
 * The installed @react-native-firebase/functions reports codes like
 * "not-found"; other versions say "functions/not-found", so both are accepted.
 */
function errorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code).replace(/^functions\//, "")
    : "";
}

/** A friendly message for a failed invite or join call. */
export function joinErrorMessage(
  error: unknown,
  fallback = "Couldn't join. Check your connection and try again.",
): string {
  return JOIN_MESSAGES[errorCode(error)] ?? fallback;
}

/** A friendly message for a failed leave or remove call. */
export function leaveErrorMessage(error: unknown, fallback: string): string {
  return LEAVE_MESSAGES[errorCode(error)] ?? fallback;
}
