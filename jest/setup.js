// jest/setup.js
import "@testing-library/jest-native/extend-expect";

// include this line for mocking react-native-gesture-handler
import "react-native-gesture-handler/jestSetup";

require('react-native-reanimated').setUpTests();

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

jest.mock('@components/ui/Text/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }) => <Text>{children}</Text>,
  };
});

jest.mock('@components/ui/Views/ThemedView', () => {
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, style, ...props }) => (
      <View style={style} {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));