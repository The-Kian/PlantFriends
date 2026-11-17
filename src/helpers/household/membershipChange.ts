/**
 * Joining or leaving a household takes the user's access to the old one away
 * on the server. If the app is still listening to the old household's plants
 * when that happens, the listener fails with permission-denied. This lets the
 * code that makes the change tell the household provider, so it can stop
 * listening first.
 */

export type MembershipChangeEvent =
  | { type: "start" }
  | { type: "end"; succeeded: boolean };

type Listener = (event: MembershipChangeEvent) => void;

const listeners = new Set<Listener>();

export function subscribeToMembershipChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Runs `change` (a call that moves the user between households) with the
 * household provider told before and after.
 */
export async function withMembershipChange<T>(
  change: () => Promise<T>,
): Promise<T> {
  listeners.forEach((listener) => listener({ type: "start" }));
  let succeeded = false;
  try {
    const result = await change();
    succeeded = true;
    return result;
  } finally {
    listeners.forEach((listener) => listener({ type: "end", succeeded }));
  }
}
