import { registerRootComponent } from "expo";

import App from "./App";
import { seedFakePlants } from "./src/dev/seedFakePlants";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

if (__DEV__) {
	if (!global.seedPlants) {
		global.seedPlants = async (options) => {
			const result = await seedFakePlants(options ?? {});
			console.log("seedPlants: completed", result);
			return result;
		};
	}
	if (!global.seedFakePlants) {
		global.seedFakePlants = global.seedPlants;
	}
}
