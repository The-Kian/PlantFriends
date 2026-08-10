import {
  calculateNextWateringDate,
  getDaysUntilWatering,
  getWateringStatus,
  getWateringFrequencyInDays,
  MILLIS_PER_DAY,
  SOON_THRESHOLD_DAYS,
} from './wateringCalculations';

describe('wateringCalculations', () => {
  const fixedNow = new Date('2025-12-18T10:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('calculateNextWateringDate adds frequency days', () => {
    const last = new Date('2025-12-10T12:00:00.000Z').getTime();
    const next = calculateNextWateringDate(last, 7);

    const expected = new Date('2025-12-17T12:00:00.000Z').getTime();
    expect(next).toBe(expected);
  });

  test('getDaysUntilWatering returns 0 for today', () => {
    const todayMidnightLocal = new Date();
    todayMidnightLocal.setHours(12, 0, 0, 0); // any time same day

    const days = getDaysUntilWatering(todayMidnightLocal.getTime());
    expect(days).toBe(0);
  });

  test('getDaysUntilWatering returns 1 for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const days = getDaysUntilWatering(tomorrow.getTime());
    expect(days).toBe(1);
  });

  test('getDaysUntilWatering returns negative for past dates', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const days = getDaysUntilWatering(threeDaysAgo.getTime());
    expect(days).toBeLessThan(0);
  });

  test('getWateringStatus maps urgency and messages', () => {
    expect(getWateringStatus(-2)).toEqual({ message: 'Overdue by 2 days', urgency: 'overdue' });
    expect(getWateringStatus(0)).toEqual({ message: 'Water today!', urgency: 'urgent' });
    expect(getWateringStatus(1)).toEqual({ message: 'Water tomorrow', urgency: 'urgent' });

    const soonDays = Math.min(SOON_THRESHOLD_DAYS, 2);
    expect(getWateringStatus(soonDays)).toEqual({ message: `Water in ${soonDays} days`, urgency: 'soon' });

    expect(getWateringStatus(SOON_THRESHOLD_DAYS + 1)).toEqual({ message: `Next watering in ${SOON_THRESHOLD_DAYS + 1} days`, urgency: 'ok' });
  });

  test('getWateringFrequencyInDays chooses custom > base > default', () => {
    expect(getWateringFrequencyInDays(5, 10)).toBe(5);
    expect(getWateringFrequencyInDays(null, 12)).toBe(12);
    expect(getWateringFrequencyInDays(undefined, undefined)).toBe(7);
  });

  test('MILLIS_PER_DAY constant equals 24h in ms', () => {
    expect(MILLIS_PER_DAY).toBe(1000 * 60 * 60 * 24);
  });
});
