import { recordHandledError } from "@/services/CrashReporting";

/** How long a write may take to reach the server before the screen moves on. */
export const QUEUED_WRITE_GRACE_MS = 3000;

/**
 * Firestore keeps a write in its local queue while the phone is offline, and
 * the write's promise only settles once the server has it. Awaiting it
 * directly leaves the screen waiting on a dead connection.
 *
 * This resolves when the server accepts the write, or after a short grace
 * period if it hasn't yet (the write carries on in the background). A
 * rejection before the grace period ends is thrown as usual; one after it is
 * recorded, because by then nothing is waiting to catch it.
 */
export async function queuedWrite(
  write: Promise<unknown>,
  context: string,
  graceMs: number = QUEUED_WRITE_GRACE_MS,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let gaveUp = false;

  const grace = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      gaveUp = true;
      resolve();
    }, graceMs);
  });

  // Attached up front so a late rejection is never unhandled.
  const guarded = write.then(
    () => undefined,
    (error: unknown) => {
      if (!gaveUp) throw error;
      recordHandledError(error, `${context} (after going offline)`);
    },
  );

  try {
    await Promise.race([guarded, grace]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
