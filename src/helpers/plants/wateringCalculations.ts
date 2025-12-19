// Threshold and time constants to avoid magic numbers
export const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
export const SOON_THRESHOLD_DAYS = 3; // within 3 days is considered "soon"

export type WateringUrgency = 'overdue' | 'urgent' | 'soon' | 'ok';

export interface WateringStatus {
  message: string;
  urgency: WateringUrgency;
}

export function calculateNextWateringDate(
  lastWatered: number,
  frequencyDays: number
): number {
  const nextDate = new Date(lastWatered);
  nextDate.setDate(nextDate.getDate() + frequencyDays);
  return nextDate.getTime();
}

/**
 * Computes days until the next watering using the device's local timezone.
 * Both "today" and the target date are normalized to local midnight.
 *
 * Timezone note:
 * - Using local time aligns with user expectations but can shift if the user travels.
 * - For a timezone-agnostic approach, normalize to UTC midnight instead.
 */
export function getDaysUntilWatering(nextWateringDate: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDate = new Date(nextWateringDate);
  nextDate.setHours(0, 0, 0, 0);

  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / MILLIS_PER_DAY);

  return diffDays;
}

export function getWateringStatus(daysUntil: number): WateringStatus {
  if (daysUntil < 0) {
    const overdueDays = Math.abs(daysUntil);
    return {
      message: `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`,
      urgency: 'overdue',
    };
  }

  if (daysUntil === 0) {
    return {
      message: 'Water today!',
      urgency: 'urgent',
    };
  }

  if (daysUntil === 1) {
    return {
      message: 'Water tomorrow',
      urgency: 'urgent',
    };
  }

  if (daysUntil <= SOON_THRESHOLD_DAYS) {
    return {
      message: `Water in ${daysUntil} days`,
      urgency: 'soon',
    };
  }

  return {
    message: `Next watering in ${daysUntil} days`,
    urgency: 'ok',
  };
}

/**
 * Get watering frequency in days from custom schedule or base frequency
 * Priority: customSchedule > baseFrequency > default (7 days)
 *
 * @param customSchedule - Custom schedule in days (number)
 * @param baseFrequency - Base watering frequency from plant data
 * @returns Frequency in days (always returns a number, defaults to 7)
 */
export function getWateringFrequencyInDays(
  customSchedule?: number | null,
  baseFrequency?: number | null
): number {
  // Priority 1: Use custom schedule if provided
  if (customSchedule != null && customSchedule > 0) {
    return customSchedule;
  }

  // Priority 2: Use base frequency if provided
  if (baseFrequency != null && baseFrequency > 0) {
    return baseFrequency;
  }

  // Default: Return 7 days as fallback
  return 7;
}
