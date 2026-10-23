import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { formatLastWatered, WateringPrediction } from './WateringPrediction';

// Themed components are mocked in jest/setup.js

describe('WateringPrediction', () => {
  const fixedNow = new Date('2025-12-18T10:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("renders 'not watered' state and handles first log action", () => {
    const onLog = jest.fn();

    render(
      <WateringPrediction
        lastWatered={null}
        wateringFrequency={7}
        onLogWatering={onLog}
      />,
    );

    expect(screen.getByText("This plant hasn't been watered yet")).toBeTruthy();

    const firstLogButton = screen.getByText('Log First Watering');
    fireEvent.press(firstLogButton);
    expect(onLog).toHaveBeenCalled();
  });

  it('shows soon status when within threshold', () => {
    const onLog = jest.fn();

    // last watered 5 days ago, frequency 7 days => 2 days until
    const lastWatered = new Date(fixedNow).getTime() - 5 * 24 * 60 * 60 * 1000;

    render(
      <WateringPrediction
        lastWatered={lastWatered}
        wateringFrequency={7}
        onLogWatering={onLog}
      />,
    );

    expect(screen.getByText(/Water in 2 days/)).toBeTruthy();
    expect(screen.getByText('Log Watering')).toBeTruthy();
  });

  it('shows overdue status for past due dates', () => {
    const onLog = jest.fn();

    // last watered 10 days ago, frequency 7 => overdue by 3 days
    const lastWatered = new Date(fixedNow).getTime() - 10 * 24 * 60 * 60 * 1000;

    render(
      <WateringPrediction
        lastWatered={lastWatered}
        wateringFrequency={7}
        onLogWatering={onLog}
      />,
    );

    expect(screen.getByText(/Overdue by 3 days/)).toBeTruthy();
  });
});

describe("formatLastWatered", () => {
  const now = new Date("2026-10-05T12:00:00Z").getTime();
  const day = 24 * 60 * 60 * 1000;

  it("says who watered it when given a name", () => {
    expect(formatLastWatered(now - 2 * day, now, "Sam")).toBe("Watered 2 days ago by Sam");
    expect(formatLastWatered(now, now, "Sam")).toBe("Watered today by Sam");
  });

  it("leaves the name off otherwise", () => {
    expect(formatLastWatered(now - day, now)).toBe("Watered yesterday");
    expect(formatLastWatered(null, now, "Sam")).toBe("Not watered yet");
  });
});
