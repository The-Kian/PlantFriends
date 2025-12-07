export default {
  expo: {
    name: "PlantFriends",
    slug: "plantfriends",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.thekian.plantfriends",
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.thekian.plantfriends",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"
    },
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "449973a1-5199-4404-834e-afb4fa814e75"
      }
    },
    plugins: [
      "@react-native-firebase/app",
      "@react-native-community/datetimepicker"
    ]
  }
};