import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { NotificationPreferences } from '@/types/api';
import {
  NOTIFICATION_TEMPLATES,
  NotificationTemplateKey,
  NotificationType
} from '@/utils/notifications';

type NotificationPayload = Record<string, unknown> & {
  amount?: number;
  orderId?: string;
  customer?: string;
};

let currentPreferences: NotificationPreferences | null = null;
let templateKey: NotificationTemplateKey = 'default';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const type = notification.request.content.data?.type as NotificationType | undefined;
    const allow = type ? shouldDisplayByType(type) : true;
    return {
      shouldShowAlert: allow,
      shouldShowBanner: allow,
      shouldShowList: allow,
      shouldPlaySound: allow && Boolean(currentPreferences?.sound),
      shouldSetBadge: false
    };
  }
});

const getTemplate = (key: NotificationTemplateKey, type: NotificationType) =>
  NOTIFICATION_TEMPLATES[key][type] ?? NOTIFICATION_TEMPLATES.default.generic;

const shouldDisplayByType = (type: NotificationType) => {
  if (!currentPreferences) return true;
  switch (type) {
    case 'sale':
      return currentPreferences.sales;
    case 'pix_generated':
    case 'pix_paid':
    case 'boleto_generated':
      return currentPreferences.boletoPix;
    case 'withdraw':
      return currentPreferences.withdraws;
    default:
      return true;
  }
};

export const updateNotificationPreferences = (
  preferences: NotificationPreferences,
  nextTemplateKey: NotificationTemplateKey
) => {
  currentPreferences = preferences;
  templateKey = nextTemplateKey;
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#06A852',
      sound: currentPreferences?.sound ? 'default' : undefined,
      enableVibrate: true
    });
  }

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted.');
    return null;
  }

  const projectId =
    ((Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId) || Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      'Expo projectId not found. Configure it in app.config.ts to generate push tokens in production builds.'
    );
  }

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  return token.data;
};

export const subscribeToNotifications = (
  listener: (notification: Notifications.Notification) => void
) => {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as Record<string, unknown>;
    const type = (data?.type as NotificationType) ?? 'generic';

    if (!shouldDisplayByType(type)) {
      return;
    }

    const template = getTemplate(templateKey, type);
    const body = notification.request.content.body ?? template.body(data);

    listener({
      ...notification,
      request: {
        ...notification.request,
        content: {
          ...notification.request.content,
          title: notification.request.content.title ?? template.title,
          body
        }
      }
    });
  });

  return () => subscription.remove();
};

export const sendLocalNotification = async (
  type: NotificationType,
  payload: NotificationPayload = {}
) => {
  if (!shouldDisplayByType(type)) return;

  const template = getTemplate(templateKey, type);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: template.title,
      body: template.body(payload),
      data: { type, ...payload },
      sound: currentPreferences?.sound ? 'default' : undefined
    },
    trigger: null
  });
};
