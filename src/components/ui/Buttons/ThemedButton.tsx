import { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { ThemedView } from '@components/ui/Views/ThemedView';
import { ThemedText } from '@components/ui/Text/ThemedText';
import { useThemedButtonStyles } from './ThemedButton.styles';

type ThemedButtonProps = {
  title?: string;
  onPress: () => void;
  additionalStyle?: ViewStyle | ViewStyle[];
};

function ThemedButton({ title, onPress,additionalStyle}: ThemedButtonProps) {
  const { colors } = useTheme();
  const buttonStyles = useThemedButtonStyles()
  

  return (
    <Pressable
    onPress={onPress}
    style={({ pressed }) => [buttonStyles.button, additionalStyle,
       pressed && buttonStyles.buttonPressed]}
    >
        <ThemedText>{title}</ThemedText>
         </Pressable>
  );
}

export default ThemedButton;