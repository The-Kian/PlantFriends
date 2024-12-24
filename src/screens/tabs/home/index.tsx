import { Image, StyleSheet } from 'react-native';

import { HelloWave } from '@components/ui/HelloWave';
import { ThemedText } from '@components/ui/Text/ThemedText';
import ParallaxScrollView from '@components/ui/Views/ParallaxScrollView';
import { ThemedView } from '@components/ui/Views/ThemedView';
import { Colors } from '@theme/Colors';

export default function HomeScreen() {

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: Colors['light'].headerBackground, dark: Colors['dark'].headerBackground }}
      headerImage={
        <Image
          source={require('../../../assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Plant Friends!</ThemedText>
        <HelloWave />

      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
