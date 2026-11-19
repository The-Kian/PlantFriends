import "./src/setupCrashAlert";
import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

if (__DEV__) {
	if (!global.seedPlants) {
		// Dev-only: keeps the seeding code out of release bundles.
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { seedFakePlants } = require("./src/dev/seedFakePlants");
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
