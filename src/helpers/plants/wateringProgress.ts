import { IPlant, IUserPlant, IUserPlantMerged } from "@/constants/IPlant";
import {
  calculateNextWateringDate,
  getDaysUntilWatering,
  getWateringFrequencyInDays,
  getWateringStatus,
  MILLIS_PER_DAY,
  type WateringStatus,
} from "@/helpers/plants/wateringCalculations";

interface WateringProgressResult {
  frequencyInDays: number;
  lastWatered: number | null;
  nextWateringDate: number | null;
  daysUntil: number | null;
  status: WateringStatus;
  progress: number;
  progressPercent: `${number}%`;
}

export function getWateringProgress(
  plant:
    | IUserPlant
    | IUserPlantMerged
    | {
        custom_watering_schedule?: number | null;
        watering_frequency?: number | null;
        last_watered_date?: number | null;
        next_watering_date?: number | null;
      },
  mergedPlant?: IPlant | IUserPlantMerged | null,
  now: number = Date.now()
): WateringProgressResult {
  const wateringFrequency =
    "watering_frequency" in plant ? plant.watering_frequency : undefined;
  const frequencyInDays = getWateringFrequencyInDays(
    plant.custom_watering_schedule ?? null,
    wateringFrequency ?? mergedPlant?.watering_frequency ?? null
  );

  const lastWatered = plant.last_watered_date ?? null;
  const nextWateringDate =
    plant.next_watering_date ??
    (lastWatered
      ? calculateNextWateringDate(lastWatered, frequencyInDays)
      : null);
  const daysUntil =
    nextWateringDate != null ? getDaysUntilWatering(nextWateringDate) : null;
  const status: WateringStatus =
    daysUntil != null
      ? getWateringStatus(daysUntil)
      : { urgency: "ok", message: "" };

  let progress = 0;
  if (lastWatered != null && frequencyInDays > 0) {
    const daysSince = Math.max(
      0,
      Math.floor((now - lastWatered) / MILLIS_PER_DAY)
    );
    progress = Math.min(1, Math.max(0, daysSince / frequencyInDays));
  } else if (daysUntil != null && frequencyInDays > 0) {
    const daysSince = Math.max(0, frequencyInDays - daysUntil);
    progress = Math.min(1, Math.max(0, daysSince / frequencyInDays));
  }

  const progressPercent = `${Math.round(progress * 100)}%` as `${number}%`;

  return {
    frequencyInDays,
    lastWatered,
    nextWateringDate,
    daysUntil,
    status,
    progress,
    progressPercent,
  };
}
