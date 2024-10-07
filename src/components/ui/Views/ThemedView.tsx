import { StyleProp, View, ViewStyle, type ViewProps } from 'react-native';
import { useTheme } from '@hooks/useTheme';


export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useTheme();

  return <View style={style} {...otherProps} />;
}