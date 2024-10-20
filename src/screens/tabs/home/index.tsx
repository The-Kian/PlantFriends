import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@components/ui/HelloWave';
import ParallaxScrollView from '@components/ui/Views/ParallaxScrollView';
import { ThemedText } from '@components/ui/Text/ThemedText';
import { ThemedView } from '@components/ui/Views/ThemedView';
import ProfileButton from '@components/navigation/ProfileButton';
import { Colors } from 'src/theme/Colors';
import ThemedButton from '@components/ui/Buttons/ThemedButton';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@components/navigation/types';

export default function HomeScreen() {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
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
