export default {
  expo: {
    name: "PlantFriends",
    slug: "plantfriends",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "plantfriends",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.thekian.plantfriends",
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist",
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.thekian.plantfriends",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      blockedPermissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.SYSTEM_ALERT_WINDOW"
      ]
    },
    extra: {
      eas: {
        projectId: "449973a1-5199-4404-834e-afb4fa814e75"
      }
    },
    plugins: [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication",
      "@react-native-community/datetimepicker",
      "expo-font",
      "expo-notifications",
      [
        // React Native Firebase needs static frameworks on iOS.
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            forceStaticLinking: ["RNFBApp", "RNFBAuth", "RNFBCrashlytics", "RNFBFirestore", "RNFBFunctions"]
          }
        }
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ]
  }
};
