import { NotificationPreferences, UserPreferencesResponse } from '@/types/api';

const defaultNotifications: NotificationPreferences = {
  withdraws: true,
  sales: true,
  boletoPix: true,
  sound: true,
  models: {
    default: true,
    creative: false
  }
};

let storedPreferences: UserPreferencesResponse = {
  theme: 'light',
  language: 'pt-BR',
  notifications: defaultNotifications,
  expoPushToken: null
};

const clone = (preferences: UserPreferencesResponse): UserPreferencesResponse => ({
  ...preferences,
  notifications: {
    ...preferences.notifications,
    models: { ...preferences.notifications.models }
  }
});

export const getUserSettings = async (): Promise<UserPreferencesResponse> => {
  return Promise.resolve(clone(storedPreferences));
};

export const updateUserSettings = async (
  payload: Partial<UserPreferencesResponse>
): Promise<UserPreferencesResponse> => {
  storedPreferences = clone({
    ...storedPreferences,
    ...payload,
    notifications: {
      ...storedPreferences.notifications,
      ...(payload.notifications ?? {}),
      models: {
        ...storedPreferences.notifications.models,
        ...(payload.notifications?.models ?? {})
      }
    }
  });

  return Promise.resolve(clone(storedPreferences));
};
