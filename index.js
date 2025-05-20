import { registerRootComponent } from 'expo';

import { AppRegistry } from 'react-native';

import App from './App';

// Register with both methods to ensure compatibility
AppRegistry.registerComponent('PlantFriends', () => App);
registerRootComponent(App);