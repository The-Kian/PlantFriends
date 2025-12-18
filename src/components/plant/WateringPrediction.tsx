import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ui/Text/ThemedText';
import { ThemedView } from '@/components/ui/Views/ThemedView';
import ThemedButton from '@/components/ui/Buttons/ThemedButton';
import { useTheme } from '@/hooks/utils/useTheme';
import {
  calculateNextWateringDate,
  getDaysUntilWatering,
  getWateringStatus,
  getWateringFrequencyInDays,
  type WateringUrgency,
} from '@/helpers/plants/wateringCalculations';

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
  const theme = useTheme();

  const frequencyInDays = getWateringFrequencyInDays(
    customSchedule,
    wateringFrequency
  );

  if (!frequencyInDays) {
    return null;
  }

  if (!lastWatered) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="water" size={24} color={theme.colors.icon} />
          <ThemedText type="subtitle" style={styles.headerText}>
            Watering Schedule
          </ThemedText>
        </View>
        <ThemedText style={styles.notWateredText}>
          This plant hasn't been watered yet
        </ThemedText>
        <ThemedButton
          title="Log First Watering"
          onPress={onLogWatering}
          variant="accept"
          additionalStyle={styles.button}
        />
      </ThemedView>
    );
  }

  const nextWateringDate = calculateNextWateringDate(
    lastWatered,
    frequencyInDays
  );
  const daysUntil = getDaysUntilWatering(nextWateringDate);
  const status = getWateringStatus(daysUntil);

  const urgencyColor = getUrgencyColor(status.urgency, theme.colors);

  const daysSinceWatered = Math.max(
    0,
    Math.floor(
      (Date.now() - lastWatered) /
        (1000 * 60 * 60 * 24)
    )
  );
  const progress = Math.min(1, daysSinceWatered / frequencyInDays);

  const lastWateredFormatted = formatDate(lastWatered);
  const nextWateringFormatted = formatDate(nextWateringDate);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="water" size={24} color={theme.colors.icon} />
        <ThemedText type="subtitle" style={styles.headerText}>
          Watering Schedule
        </ThemedText>
      </View>

      <View style={styles.infoRow}>
        <ThemedText style={styles.label}>Last watered:</ThemedText>
        <ThemedText style={styles.value}>{lastWateredFormatted}</ThemedText>
      </View>

      <View style={styles.infoRow}>
        <ThemedText style={styles.label}>Next watering:</ThemedText>
        <ThemedText style={styles.value}>{nextWateringFormatted}</ThemedText>
      </View>

      <View style={styles.statusContainer}>
        <ThemedText
          style={[styles.statusText, { color: urgencyColor }]}
          type="defaultSemiBold"
        >
          {status.message}
        </ThemedText>
      </View>

      <View style={[styles.progressBarContainer, { borderColor: theme.colors.border }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: urgencyColor,
            },
          ]}
        />
      </View>

      {(status.urgency === 'urgent' || status.urgency === 'overdue') && (
        <ThemedButton
          title="Log Watering"
          onPress={onLogWatering}
          variant="accept"
          additionalStyle={styles.button}
        />
      )}

      {status.urgency !== 'urgent' && status.urgency !== 'overdue' && (
        <ThemedButton
          title="Log Watering"
          onPress={onLogWatering}
          variant="default"
          additionalStyle={styles.buttonSecondary}
        />
      )}
    </ThemedView>
  );
}

function getUrgencyColor(
  urgency: WateringUrgency,
  colors: any
): string {
  switch (urgency) {
    case 'overdue':
      return colors.error || '#FF5252';
    case 'urgent':
      return colors.redButton || '#FF0000';
    case 'soon':
      return '#FFA500'; // Orange
    case 'ok':
      return colors.greenButton || '#00A86B';
    default:
      return colors.text;
  }
}


function formatDate(epochMs: number): string {
  const dateObj = new Date(epochMs);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    opacity: 0.7,
  },
  value: {
    fontWeight: '600',
  },
  statusContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  button: {
    marginTop: 12,
  },
  buttonSecondary: {
    marginTop: 8,
  },
  notWateredText: {
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.7,
  },
});
