import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { View, StyleSheet } from 'react-native';

import ThemedButton from '@/components/ui/Buttons/ThemedButton';
import { ThemedText } from '@/components/ui/Text/ThemedText';
import { MILLIS_PER_DAY, type WateringUrgency } from '@/helpers/plants/wateringCalculations';
import { getWateringProgress } from '@/helpers/plants/wateringProgress';
import { useTheme } from '@/hooks/utils/useTheme';
import { type ThemeColors } from '@/theme/Colors';

interface WateringPredictionProps {
  lastWatered: number | null;
  wateringFrequency?: number | null;
  customSchedule?: number | null;
  onLogWatering: () => void;
}

export function WateringPrediction({
  lastWatered,
  wateringFrequency,
  customSchedule,
  onLogWatering,
}: WateringPredictionProps) {
  const { colors, radius, shadow } = useTheme();
  const wateringProgress = getWateringProgress({
    custom_watering_schedule: customSchedule ?? null,
    watering_frequency: wateringFrequency ?? null,
    last_watered_date: lastWatered ?? null,
    next_watering_date: null,
  });

  const cardStyle = [
    styles.container,
    shadow,
    { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.large },
  ];

  const header = (
    <View style={styles.header}>
      <View style={[styles.headerIcon, { backgroundColor: colors.waterMuted, borderRadius: radius.pill }]}>
        <Ionicons name="water" size={18} color={colors.water} />
      </View>
      <ThemedText type="subtitle" style={styles.headerText}>
        Watering Schedule
      </ThemedText>
    </View>
  );

  if (!wateringProgress.lastWatered) {
    return (
      <View style={cardStyle}>
        {header}
        <ThemedText style={[styles.notWateredText, { color: colors.textMuted }]}>
          This plant hasn't been watered yet
        </ThemedText>
        <ThemedButton
          title="Log First Watering"
          onPress={onLogWatering}
          icon="water-outline"
          variant="accept"
        />
      </View>
    );
  }

  const {
    nextWateringDate,
    status,
    progressPercent,
    frequencyInDays,
    lastWatered: lastWateredDate,
  } = wateringProgress;

  const urgencyColor = getUrgencyColor(status.urgency, colors);
  const needsWater = status.urgency === 'urgent' || status.urgency === 'overdue';

  const rows: [string, string][] = [
    ['Last watered', formatDate(lastWateredDate)],
    ['Next watering', nextWateringDate ? formatDate(nextWateringDate) : 'Not scheduled'],
  ];
  if (frequencyInDays > 0) {
    rows.push(['Frequency', `Every ${frequencyInDays} day${frequencyInDays === 1 ? '' : 's'}`]);
  }

  return (
    <View style={cardStyle}>
      {header}

      {status.message ? (
        <View
          style={[
            styles.statusPill,
            { backgroundColor: needsWater ? colors.errorMuted : colors.surfaceMuted, borderRadius: radius.small },
          ]}
        >
          <ThemedText style={[styles.statusText, { color: urgencyColor }]}>
            {status.message}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.progressBarContainer, { backgroundColor: colors.surfaceMuted }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: progressPercent, backgroundColor: urgencyColor },
          ]}
        />
      </View>

      {rows.map(([label, value]) => (
        <View key={label} style={styles.infoRow}>
          <ThemedText style={[styles.label, { color: colors.textMuted }]}>{label}</ThemedText>
          <ThemedText style={styles.value}>{value}</ThemedText>
        </View>
      ))}

      <ThemedButton
        title="Log Watering"
        onPress={onLogWatering}
        icon="water-outline"
        variant={needsWater ? 'accept' : 'secondary'}
        additionalStyle={styles.button}
      />
    </View>
  );
}

export function getUrgencyColor(
  urgency: WateringUrgency,
  colors: ThemeColors
): string {
  switch (urgency) {
    case 'overdue':
    case 'urgent':
      return colors.error;
    case 'soon':
      return colors.warning;
    case 'ok':
      return colors.success;
    default:
      return colors.text;
  }
}

/** Short relative description, e.g. "Watered today" / "Watered 3 days ago". */
export function formatLastWatered(epochMs: number | null, now: number = Date.now()): string {
  if (!epochMs) {
    return 'Not watered yet';
  }
  const days = Math.floor((now - epochMs) / MILLIS_PER_DAY);
  if (days <= 0) return 'Watered today';
  if (days === 1) return 'Watered yesterday';
  return `Watered ${days} days ago`;
}

function formatDate(epochMs: number): string {
  const dateObj = new Date(epochMs);
  return dateObj.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
  },
  statusPill: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
  },
  notWateredText: {
    textAlign: 'center',
    marginVertical: 8,
  },
});
