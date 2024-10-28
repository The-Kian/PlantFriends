import { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { ThemedView } from '@components/ui/Views/ThemedView';
import { ThemedText } from '@components/ui/Text/ThemedText';
import { useThemedButtonStyles } from './ThemedButton.styles';

type ThemedButtonProps = {
  title?: string;
  onPress: () => void;
  variant?: 'default' | 'accept' | 'decline';
  additionalStyle?: ViewStyle | ViewStyle[];
};

function ThemedButton({ title, onPress,additionalStyle, variant: variant = 'default'
}: ThemedButtonProps) {
  const { colors } = useTheme();
  const buttonStyles = useThemedButtonStyles()

  let varientStyle = {};
  if (variant === 'accept') {
    varientStyle = buttonStyles.acceptButton;
  } else if (variant === 'decline') {
    varientStyle = buttonStyles.cancelButton;
  }

  return (
    <Pressable
    onPress={onPress}
    style={({ pressed }) => [buttonStyles.button, varientStyle, additionalStyle,
       pressed && buttonStyles.buttonPressed]}
    >
        <ThemedText>{title}</ThemedText>
         </Pressable>
  );
}

export default ThemedButton;