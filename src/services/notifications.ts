import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { NotificationPreferences } from '@/types/api';
import {
  NOTIFICATION_TEMPLATES,
  NotificationTemplate,
  NotificationTemplateKey,
  NotificationType
} from '@/utils/notifications';

type NotificationPayload = Record<string, unknown> & {
  amount?: number;
  orderId?: string;
  customer?: string;
};

type LocalNotificationOptions = {
  templateKey?: NotificationTemplateKey;
  bypassTypeFilter?: boolean;
};

type ExpoPushTestOptions = {
  type?: NotificationType;
  amount?: number;
  templateKey?: NotificationTemplateKey;
  paymentMethod?: string;
  customer?: string;
};

let currentPreferences: NotificationPreferences | null = null;
let templateKey: NotificationTemplateKey = 'default';
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const MEDUSA_NOTIFICATION_IMAGE_URL =
  'https://raw.githubusercontent.com/RicardoMouraa/Medusa_App/main/assets/icon-notifica%C3%A7%C3%A3o-0.png';

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

const resolveTemplateTitle = (template: NotificationTemplate, payload: Record<string, unknown>) =>
  typeof template.title === 'function' ? template.title(payload) : template.title;

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

export const sendExpoPushTestNotificationAsync = async (
  expoPushToken: string,
  options: ExpoPushTestOptions = {}
) => {
  const type = options.type ?? 'sale';
  const amount = options.amount ?? 189.9;
  const activeTemplate = options.templateKey ?? templateKey;
  const template = getTemplate(activeTemplate, type);
  const payloadData = {
    type,
    amount,
    orderId: `test-${Date.now()}`,
    paymentMethod:
      options.paymentMethod ?? (type.includes('pix') ? 'pix' : type.includes('boleto') ? 'boleto' : 'cartao'),
    customer: options.customer ?? 'Cliente teste'
  };

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: expoPushToken,
      title: resolveTemplateTitle(template, payloadData),
      body: template.body(payloadData),
      sound: 'default',
      data: {
        ...payloadData,
        iconUrl: MEDUSA_NOTIFICATION_IMAGE_URL
      },
      richContent: {
        image: MEDUSA_NOTIFICATION_IMAGE_URL
      }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Expo push test failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }

  return payload;
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
    const resolvedTitle = resolveTemplateTitle(template, data);
    const body = notification.request.content.body ?? template.body(data);

    listener({
      ...notification,
      request: {
        ...notification.request,
        content: {
          ...notification.request.content,
          title: notification.request.content.title ?? resolvedTitle,
          body
        }
      }
    });
  });

  return () => subscription.remove();
};

export const sendLocalNotification = async (
  type: NotificationType,
  payload: NotificationPayload = {},
  options: LocalNotificationOptions = {}
) => {
  if (!options.bypassTypeFilter && !shouldDisplayByType(type)) return;

  const template = getTemplate(options.templateKey ?? templateKey, type);
  const content: Notifications.NotificationContentInput & {
    attachments?: Notifications.NotificationContentAttachmentIos[];
  } = {
    title: resolveTemplateTitle(template, payload),
    body: template.body(payload),
    data: { type, ...payload, iconUrl: MEDUSA_NOTIFICATION_IMAGE_URL },
    sound: currentPreferences?.sound ? 'default' : undefined
  };

  content.attachments = [
    {
      identifier: 'medusa-logo',
      url: MEDUSA_NOTIFICATION_IMAGE_URL,
      type: 'public.png'
    }
  ];

  await Notifications.scheduleNotificationAsync({
    content,
    trigger: null
  });
};
