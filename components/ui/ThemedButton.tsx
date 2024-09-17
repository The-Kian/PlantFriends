import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { createButtonStyles } from '@/styles/buttonStyles';

type ThemedButtonProps = {
  children: ReactNode;
  onPress: () => void;
};

function ThemedButton({ children, onPress }: ThemedButtonProps) {
  const { colors } = useTheme();
  const buttonStyles = createButtonStyles({ colors });

  return (
    <Pressable
      style={({ pressed }) => [buttonStyles.buttons, pressed && buttonStyles.buttonPressed]}
      onPress={onPress}
    >
      <ThemedView style={buttonStyles.buttons}>
        <ThemedText style={buttonStyles.buttonText}>{children}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default ThemedButton;