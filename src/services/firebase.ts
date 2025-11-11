import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, initializeAuth } from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBh0kPw8D-a5IZUx9UjlctNPEpmSbP6GXQ",
  authDomain: "medusa-app-2025.firebaseapp.com",
  projectId: "medusa-app-2025",
  storageBucket: "medusa-app-2025.firebasestorage.app",
  messagingSenderId: "561443943131",
  appId: "1:561443943131:web:1a58008b342d71ee8512fe",
  measurementId: "G-0J95YQNL1K"
};

const app = initializeApp(firebaseConfig);

type ExtraConfig = {
  enableFirebaseAnalytics?: boolean;
};

const resolveExtraConfig = (): ExtraConfig => {
  if (Constants.expoConfig?.extra) {
    return Constants.expoConfig.extra as ExtraConfig;
  }

  const manifest2 = (Constants as unknown as { manifest2?: { extra?: ExtraConfig } }).manifest2;
  if (manifest2?.extra) {
    return manifest2.extra;
  }

  if (Constants.manifest?.extra) {
    return Constants.manifest.extra as ExtraConfig;
  }

  return {};
};

const extra = resolveExtraConfig();

const analytics =
  extra.enableFirebaseAnalytics === true && typeof window !== 'undefined'
    ? (() => {
        try {
          return getAnalytics(app);
        } catch {
          return undefined;
        }
      })()
    : undefined;

type ReactNativePersistenceFactory = (storage: typeof AsyncStorage) => Persistence;

let reactNativePersistenceFactory: ReactNativePersistenceFactory | null = null;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rnExports = require('@firebase/auth-compat/dist/rn/index.js');
    if (typeof rnExports.getReactNativePersistence === 'function') {
      reactNativePersistenceFactory = rnExports.getReactNativePersistence;
    }
  } catch (error) {
    console.warn('[Firebase] React Native persistence unavailable. Falling back to memory.', error);
  }
}

const auth =
  Platform.OS === 'web' || !reactNativePersistenceFactory
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: reactNativePersistenceFactory(AsyncStorage)
      });
const db = getFirestore(app);

export { app, analytics, auth, db };
