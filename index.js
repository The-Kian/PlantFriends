import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// Register with both methods to ensure compatibility
AppRegistry.registerComponent('PlantFriends', () => App);
registerRootComponent(App);