import functions from "@react-native-firebase/functions";

/**
 * Leaves the signed-in user's household. The server hands their plants to
 * whoever is left and clears their householdId; the provider then sets up a
 * household of their own.
 */
export async function leaveHousehold(): Promise<void> {
  const callable = functions().httpsCallable<undefined, { left: boolean }>(
    "leaveHousehold",
  );
  await callable();
}

/** Removes a member. Only the person who made the household may do this. */
export async function removeMember(uid: string): Promise<void> {
  const callable = functions().httpsCallable<
    { uid: string },
    { removed: boolean }
  >("removeMember");
  await callable({ uid });
}

const MESSAGES: Record<string, string> = {
  "failed-precondition": "You're the only member of this household.",
  "permission-denied":
    "You can't do that. Only the person who made this household can remove people.",
  "not-found": "That person isn't in this household.",
};

/**
 * A friendly message for a failed leave or remove call. Both "not-found" and
 * "functions/not-found" are accepted, as in invites.ts.
 */
export function memberErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code).replace(/^functions\//, "")
      : "";
  return (
    MESSAGES[code] ?? "Couldn't do that. Check your connection and try again."
  );
}
