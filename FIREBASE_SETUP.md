# Firebase Configuration Setup

## ⚠️ Security Notice

The Firebase configuration files (`google-services.json` and `GoogleService-Info.plist`) contain sensitive API keys and are **NOT** committed to the repository for security reasons.

## Setup Instructions

1. **Download your Firebase configuration files:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `plantfriends-31bcc`
   - For Android: Download `google-services.json` and place it in the project root
   - For iOS: Download `GoogleService-Info.plist` and place it in the project root

2. **Place the files:**
   ```
   google-services.json          (root directory)
   GoogleService-Info.plist      (root directory)
   ```

3. **Verify the files are ignored:**
   - The files should be listed in `.gitignore`
   - They will be automatically copied to the correct native directories during `expo prebuild`

## Important Security Notes

- **Never commit these files to version control**
- If these files were previously committed, you should:
  1. Regenerate the API keys in Firebase Console
  2. The old keys in git history should be considered compromised
  3. Review Firebase Console for any unauthorized access

## Current Configuration

Your `app.json` is configured to use these files:
- Android: `./google-services.json`
- iOS: `./GoogleService-Info.plist`

The `@react-native-firebase/app` config plugin will automatically handle the integration during prebuild.

