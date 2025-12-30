# DryverHub - React Native Mobile Application

## Project Overview
This is a React Native mobile application for iOS and Android, created using `@react-native-community/cli`.

## Technology Stack
- **Framework**: React Native 0.83.1
- **Language**: TypeScript
- **Package Manager**: npm
- **iOS Dependencies**: CocoaPods (via Bundler)

## Development Setup

### Prerequisites
- Node.js and npm installed
- For iOS: Xcode and Xcode Command Line Tools
- For Android: Android Studio and Android SDK

### Installation
```bash
npm install
```

### iOS Setup (macOS only)
iOS native dependencies require CocoaPods. Note: You may need to install Xcode Command Line Tools first.

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

### Running the Application

#### Start Metro Bundler
```bash
npm start
```

#### Run on Android
```bash
npm run android
```

#### Run on iOS
```bash
npm run ios
```

## Available Scripts
- `npm start` - Start Metro bundler
- `npm run android` - Build and run Android app
- `npm run ios` - Build and run iOS app
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests

## Project Structure
- `/android` - Android native code
- `/ios` - iOS native code
- `/src` - React Native source code
- `App.tsx` - Main application component

## Notes
- Metro bundler must be running before launching the app
- iOS builds require CocoaPods dependencies to be installed
- Android builds require an emulator or connected device

Work through each checklist item systematically.
Keep communication concise and focused.
Follow development best practices.
