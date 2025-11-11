import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

const bundleIdentifier = process.env.APP_BUNDLE_IDENTIFIER ?? 'com.medusapay.app';
const androidPackage = process.env.APP_ANDROID_PACKAGE ?? bundleIdentifier;
const enableFirebaseAnalytics = process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MedusaPay',
  slug: 'medusa-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A7E51'
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier,
    infoPlist: {
      NSUserNotificationUsageDescription:
        'Usamos notificacoes para alertar sobre vendas, saques e eventos do painel Medusa Pay.'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000'
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: androidPackage,
    permissions: ['android.permission.POST_NOTIFICATIONS']
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    enableFirebaseAnalytics
  },
  plugins: ['expo-notifications']
});
