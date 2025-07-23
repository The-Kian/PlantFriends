import { Pressable, ViewStyle } from 'react-native';

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
  const buttonStyles = useThemedButtonStyles()

  let varientStyle = {};
  if (variant === 'accept') {
    varientStyle = buttonStyles.acceptButton;
  } else if (variant === 'decline') {
    varientStyle = buttonStyles.cancelButton;
  }

  return (
    <Pressable
      testID="themed-button"
      onPress={onPress}
      style={({ pressed }) => [buttonStyles.button, varientStyle, additionalStyle,
        pressed && buttonStyles.buttonPressed]}
    >
        <ThemedText>{title}</ThemedText>
         </Pressable>
  );
}

export default ThemedButton;