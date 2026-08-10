const React = require('react');
const { View, Text } = require('react-native');

const Ionicons = ({ name, color, size, testID, children, ...props }) => (
  <View testID={testID} name={name} color={color} size={size} {...props}>
    <Text>{children ?? name}</Text>
  </View>
);

module.exports = {
  Ionicons,
};
