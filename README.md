# PlantFriends - Plant Care Management App

A React Native mobile application that helps users discover, save, and manage their houseplant collection with personalized care information.

## 🌱 Features

- 🔍 **Plant Search**: Search plants from multiple data sources (Firebase, Perenual API)
- 📝 **Plant Collection**: Save and organize your personal plant collection
- 🏠 **Room Organization**: Organize plants by location (Living Room, Kitchen, etc.)
- ✏️ **Custom Care Info**: Add personalized notes and care schedules
- 🎨 **Theme Support**: Light and dark mode
- 🔐 **User Authentication**: Secure Firebase authentication
- 📱 **Cross-Platform**: iOS and Android support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Yarn 4.4.0
- Expo CLI
- iOS Simulator (Mac) or Android Studio (for emulators)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/The-Kian/PlantFriends.git
   cd PlantFriends
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PERENUAL_API_KEY=your_perenual_api_key_here
   ```
   
   Get your Perenual API key from: https://perenual.com/docs/api

4. **Set up Firebase**
   
   - Create a Firebase project at https://console.firebase.google.com
   - Download `google-services.json` (Android) and place in `/android/app/`
   - Download `GoogleService-Info.plist` (iOS) and place in root directory
   - Enable Authentication (Email/Password) in Firebase Console
   - Create Firestore database with the following structure:
     ```
     Collections:
     - users/
     - Plants/
     - UserPlants/
     ```

5. **Run the app**
   ```bash
   # Start Expo dev server
   yarn start
   
   # Run on Android
   yarn android
   
   # Run on iOS (Mac only)
   yarn ios
   ```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test --coverage

# Run tests in watch mode
yarn test --watch

# Run linter
yarn lint
```

## 📁 Project Structure

```
PlantFriends/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   ├── hooks/            # Custom React hooks
│   ├── helpers/          # Business logic & API calls
│   ├── context/          # React Context providers
│   ├── store/            # Redux store & slices
│   ├── theme/            # Design system (colors, fonts, spacing)
│   ├── constants/        # TypeScript interfaces & constants
│   └── test-utils/       # Testing utilities
├── assets/               # Images, fonts
├── android/              # Android native code
├── __mocks__/            # Jest mocks
└── jest/                 # Jest configuration
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation. This project is a solo/hobby MVP — recommendations in `TECH_DEBT.md` are optional and intended as future improvements.

## 🏗️ Architecture

- **Framework**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **State Management**: Redux Toolkit + React Context
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Backend**: Firebase (Auth + Firestore)
- **Testing**: Jest + React Testing Library
- **Styling**: React Native StyleSheet + Custom theme system

## 🔧 Configuration Files

- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint rules
- `jest.config.js` - Jest testing configuration
- `app.json` - Expo configuration
- `babel.config.js` - Babel transpilation settings

## 📋 Available Scripts

```bash
yarn start          # Start Expo dev server
yarn android        # Run on Android device/emulator
yarn ios            # Run on iOS simulator
yarn test           # Run tests
yarn lint           # Lint code with ESLint
```

## 🐛 Known Issues & Technical Debt

See [TECH_DEBT.md](./TECH_DEBT.md) for a prioritized list of improvements. Because this is a solo/hobby MVP, some items (like adding a full error-tracking pipeline or strict env validation) are optional and can be postponed until you decide to share or ship the app.

**👉 Read `TECH_DEBT.md` for recommendations, but treat non-blocking items as "nice to have" rather than blockers.**

## 🎯 Development Guidelines

### Code Style
- Use TypeScript with strict mode
- Follow existing patterns (see ARCHITECTURE.md)
- Write tests for new features (co-locate with source)
- Use path aliases: `@/` for `src/`, `@assets/` for `assets/`
- Follow ESLint rules

### Component Structure
```tsx
// Good component pattern
interface Props {
  plant: IPlant;
  onPress: () => void;
}

const PlantCard = ({ plant, onPress }: Props) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedText>{plant.name}</ThemedText>
    </TouchableOpacity>
  );
};

export default PlantCard;
```

### Testing Pattern
```tsx
// Always use test utilities
import { renderWithProviders } from '@/test-utils/renderWithProviders';

describe('PlantCard', () => {
  it('displays plant name', () => {
    const { getByText } = renderWithProviders(
      <PlantCard plant={mockPlant} onPress={jest.fn()} />
    );
    expect(getByText('Test Plant')).toBeTruthy();
  });
});
```

## 🚢 Deployment

### Development Build
```bash
yarn android  # or yarn ios
```

### Production Build (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS (first time only)
eas login
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 📱 App Information

- **App Name**: PlantFriends
- **Package Name**: com.thekian.plantfriends
- **Bundle ID**: com.thekian.plantfriends
- **Version**: 1.0.0

## 🤝 Contributing

1. Read [TECH_DEBT.md](./TECH_DEBT.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Create a feature branch from `main`
3. Make your changes
4. Write/update tests
5. Run `yarn test` and `yarn lint`
6. Submit a pull request

### Commit Message Format
```
feat: Add plant watering reminder feature
fix: Resolve duplicate search results
refactor: Clean up duplicate Firebase helpers
test: Add tests for plant management hook
docs: Update architecture documentation
```

## 📄 License

Private repository - All rights reserved

## 🆘 Troubleshooting

### Common Issues

**"Cannot find module '@env'"**
- Ensure `.env` file exists in root directory
- Restart Metro bundler: `yarn start --reset-cache`

**"Firebase is not configured"**
- Verify `google-services.json` and `GoogleService-Info.plist` are in correct locations
- Rebuild the app: `yarn android` or `yarn ios`

**"Tests failing with module resolution errors"**
- Clear Jest cache: `yarn test --clearCache`
- Verify `__mocks__/@env.js` exists

**"Build fails on Android"**
- Clean build: `cd android && ./gradlew clean && cd ..`
- Check Firebase configuration files are present

## 📞 Support

For issues or questions:
1. Check [TECH_DEBT.md](./TECH_DEBT.md) for known issues
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions
3. Create an issue on GitHub

## 🗺️ Roadmap

### Immediate (Before New Features)
- [ ] Resolve duplicate file structure
- [ ] Implement proper error handling
- [ ] Add error boundaries
- [ ] Remove all `any` types
- [ ] Add environment variable validation

### Short Term
- [ ] Add plant watering reminders
- [ ] Implement image upload for plants
- [ ] Add plant care calendar
- [ ] Improve search with filters

### Long Term
- [ ] Push notifications
- [ ] Plant health tracking
- [ ] Community features
- [ ] Plant identification via camera
- [ ] Offline support

---

**Made with 🌿 by Kian**
