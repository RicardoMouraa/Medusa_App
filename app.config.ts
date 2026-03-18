import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

const packageVersion =
  process.env.APP_VERSION ?? require('./package.json').version;

const bundleIdentifier =
  process.env.APP_BUNDLE_IDENTIFIER ?? 'com.medusapay.app';

const androidPackage =
  process.env.APP_ANDROID_PACKAGE ?? 'com.medusapay.app';

const enableFirebaseAnalytics =
  process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true';

const easProjectId =
  'b9a0632d-51f9-4c2e-95e5-307d4326f29d';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: 'Medusa Pay',
  slug: 'medusa-app',
  version: packageVersion,

  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,

  icon: './assets/icon.png',

  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A7E51'
  },

  ios: {
    bundleIdentifier,
    supportsTablet: false,
    buildNumber: '1',
    infoPlist: {
      CFBundleDisplayName: 'Medusa Pay',
      NSUserNotificationUsageDescription:
        'Usamos notificações para alertar sobre vendas, saques e eventos do painel MedusaPay.'
    }
  },

  android: {
    package: androidPackage,
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000'
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: ['android.permission.POST_NOTIFICATIONS']
  },

  web: {
    favicon: './assets/favicon.png'
  },

  notification: {
    icon: './assets/icon-notificação-0.png',
    color: '#06A852'
  },

  extra: {
    enableFirebaseAnalytics,
    eas: {
      projectId: easProjectId
    }
  },

  plugins: [
    [
      'expo-notifications',
      {
        icon: './assets/icon-notificação-0.png',
        color: '#06A852',
        defaultChannel: 'default'
      }
    ]
  ]
});

