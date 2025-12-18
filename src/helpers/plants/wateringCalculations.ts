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

export function getDaysUntilWatering(nextWateringDate: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDate = new Date(nextWateringDate);
  nextDate.setHours(0, 0, 0, 0);

  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

  if (daysUntil <= 3) {
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
 * @returns Frequency in days, or null if unable to calculate
 */
export function getWateringFrequencyInDays(
  customSchedule?: number | null,
  baseFrequency?: number | null
): number | null {
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
