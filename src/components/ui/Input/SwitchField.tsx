// SwitchField.tsx

import React from "react";

import { StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";
import { useTheme } from "@/hooks/utils/useTheme";

import { useInputStyles } from "./Input.styles";

interface SwitchFieldProps {
  label: string;
  /** One line under the label explaining what the switch does. */
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const SwitchField = ({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: SwitchFieldProps) => {
  const inputStyles = useInputStyles();
  const { colors } = useTheme();

  return (
    <View style={[inputStyles.fieldContainer, styles.row]}>
      <View style={styles.text}>
        <ThemedText style={[inputStyles.inputLabel, styles.label]}>
          {label}
        </ThemedText>
        {description ? (
          <ThemedText style={[styles.description, { color: colors.textMuted }]}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    flex: 1,
  },
  label: {
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default SwitchField;
