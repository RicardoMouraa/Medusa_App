import { NotificationPreferences, UserPreferencesResponse } from '@/types/api';
import { DEFAULT_DASHBOARD_ID } from '@/constants/dashboards';

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
  expoPushToken: null,
  selectedDashboardId: DEFAULT_DASHBOARD_ID,
  dashboardAliases: {}
};

const clone = (preferences: UserPreferencesResponse): UserPreferencesResponse => ({
  ...preferences,
  notifications: {
    ...preferences.notifications,
    models: { ...preferences.notifications.models }
  },
  dashboardAliases: {
    ...(preferences.dashboardAliases ?? {})
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
    },
    dashboardAliases: {
      ...(storedPreferences.dashboardAliases ?? {}),
      ...(payload.dashboardAliases ?? {})
    }
  });

  return Promise.resolve(clone(storedPreferences));
};
