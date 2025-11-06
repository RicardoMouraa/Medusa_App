# MedusaPay Mobile (Offline Demo)

Expo + React Native application that mirrors the MedusaPay dashboard experience (home metrics, orders, finance tools, settings and push notifications).  
This build runs entirely offline: authentication was removed and every screen uses mocked data returned from `src/services/api.ts`.

## Requirements
- Node.js 18 or newer
- Expo CLI (optional) – `npm install -g expo-cli`
- Android Studio, Xcode or a physical device / Expo Go for testing

## Setup
1. Install dependencies  
   `npm install`
2. Start the project  
   `npm run android` (or `npm run ios` / `npm run web`)

No environment variables, backend services or proxy servers are required.

## Features
- Home dashboard with period selector, balance cards and sales breakdown populated with sample numbers.
- Orders list + detail view backed by static mock orders.
- Finance screen that simulates PIX withdraw requests and updates the in-memory balance/history.
- Settings screen with persisted (AsyncStorage) notification and theme preferences.
- Local push notification helper ready for Expo development builds.

## Project Structure
```
src/
  components/        Reusable UI elements
  context/           Preferences provider (theme + notifications)
  hooks/             Toast helper and generic utilities
  navigation/        Stack + Bottom Tabs configuration
  screens/           Home, Orders, Finance, Settings
  services/          Mock API + notification helpers
  theme/             Light/dark palettes
  utils/             Formatting, validation, notification templates
```

## Data & Customisation
- `src/services/api.ts` exports async functions that resolve mocked responses. Adjust the constants in that file to change the sample data or reintroduce real API calls.
- Removing the mocked layer later requires wiring a real backend + authentication flow (previous implementation used MedusaPay tokens and a proxy).
- Preferences are persisted locally via `AsyncStorage`; remote sync calls now update only the local mock state.

## Notifications
- Implemented with `expo-notifications` (`src/services/notifications.ts`).
- Templates live in `src/utils/notifications.ts`; the preferences context handles opt-in/out and sound toggles.
- Remote push tests still require an Expo development build (`expo run:android` or `expo run:ios`).

## Notes
- `app.config.ts` now only registers the notifications plugin; no `.env` file is necessary.
- Backend, frontend and proxy folders were removed—this project focuses solely on the mobile client demo.
