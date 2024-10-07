import { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { ThemedView } from '@components/ui/ThemedView';
import { ThemedText } from '@components/ui/ThemedText';
import { createButtonStyles } from '@styles/buttonStyles';

type ThemedButtonProps = {
  title?: string;
  onPress: () => void;
  additionalStyle?: ViewStyle | ViewStyle[];
};

function ThemedButton({ title, onPress,additionalStyle}: ThemedButtonProps) {
  const { colors } = useTheme();
  const buttonStyles = createButtonStyles({ colors });
  

  return (
    <Pressable
    onPress={onPress}
    style={({ pressed }) => [buttonStyles.buttons, additionalStyle,
       pressed && buttonStyles.buttonPressed]}
    >
        <ThemedText>{title}</ThemedText>
         </Pressable>
  );
}

export default ThemedButton;