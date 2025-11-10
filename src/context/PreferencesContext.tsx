import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { getUserSettings, updateUserSettings } from '@/services/preferences';
import { ApiError } from '@/types/api';
import {
  registerForPushNotificationsAsync,
  updateNotificationPreferences
} from '@/services/notifications';
import { darkTheme, lightTheme, buildNavigationTheme, MedusaTheme } from '@/theme';
import { NotificationPreferences, UserPreferencesResponse } from '@/types/api';

type PreferencesState = UserPreferencesResponse & {
  expoPushToken?: string | null;
};

type PreferencesContextValue = {
  preferences: PreferencesState;
  theme: MedusaTheme;
  navigationTheme: ReturnType<typeof buildNavigationTheme>;
  isLoading: boolean;
  isSyncing: boolean;
  setTheme: (mode: 'light' | 'dark') => void;
  toggleNotification: (key: keyof NotificationPreferences) => void;
  toggleNotificationModel: (model: keyof NotificationPreferences['models']) => void;
  setNotifications: (notifications: NotificationPreferences) => void;
  refreshFromServer: () => Promise<void>;
  refreshPushToken: () => Promise<string | null>;
};

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

const defaultState: PreferencesState = {
  theme: 'light',
  language: 'pt-BR',
  notifications: defaultNotifications,
  expoPushToken: null
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const mergePreferences = (base: PreferencesState, incoming?: Partial<PreferencesState>) => {
  if (!incoming) return base;
  return {
    ...base,
    ...incoming,
    notifications: {
      ...base.notifications,
      ...(incoming.notifications ?? {}),
      models: {
        ...base.notifications.models,
        ...(incoming.notifications?.models ?? {})
      }
    }
  };
};

const determineTemplateKey = (notifications: NotificationPreferences) =>
  notifications.models.creative ? 'creative' : 'default';

export const PreferencesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [preferences, setPreferences] = useState<PreferencesState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isHydratedRef = useRef(false);
  const suppressRemoteSyncRef = useRef(false);
  const remoteSyncTimeout = useRef<NodeJS.Timeout | null>(null);

  const persistLocal = useCallback(async (next: PreferencesState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(next));
    } catch (error) {
      console.error('[Preferences] Failed to persist locally', error);
    }
  }, []);

  const loadLocalPreferences = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.preferences);
      const parsed = raw ? (JSON.parse(raw) as PreferencesState) : undefined;
      setPreferences((prev) => mergePreferences(prev, parsed));
    } catch (error) {
      console.error('[Preferences] Failed to load local preferences', error);
    } finally {
      isHydratedRef.current = true;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocalPreferences();
  }, [loadLocalPreferences]);

  const syncNotificationPreferences = useCallback(
    (state: PreferencesState) => {
      updateNotificationPreferences(state.notifications, determineTemplateKey(state.notifications));
    },
    []
  );

  useEffect(() => {
    if (!isHydratedRef.current) return;
    syncNotificationPreferences(preferences);
    void persistLocal(preferences);
  }, [preferences, persistLocal, syncNotificationPreferences]);

  const scheduleRemoteSync = useCallback(
    (next: PreferencesState) => {
      if (suppressRemoteSyncRef.current) return;
      if (remoteSyncTimeout.current) {
        clearTimeout(remoteSyncTimeout.current);
      }
      remoteSyncTimeout.current = setTimeout(async () => {
        try {
          setIsSyncing(true);
          await updateUserSettings({
            theme: next.theme,
            language: next.language,
            notifications: next.notifications,
            expoPushToken: next.expoPushToken
          });
        } catch (error) {
          const apiError = error as ApiError;
          console.error('[Preferences] Failed to sync with API', apiError.message);
        } finally {
          setIsSyncing(false);
        }
      }, 600);
    },
    []
  );

  useEffect(
    () => () => {
      if (remoteSyncTimeout.current) {
        clearTimeout(remoteSyncTimeout.current);
      }
    },
    []
  );

  const applyPreferences = useCallback(
    (updater: PreferencesState | ((current: PreferencesState) => PreferencesState), options?: {
      skipRemoteSync?: boolean;
    }) => {
      setPreferences((current) => {
        const next =
          typeof updater === 'function'
            ? (updater as (current: PreferencesState) => PreferencesState)(current)
            : updater;
        if (!options?.skipRemoteSync) {
          scheduleRemoteSync(next);
        }
        return next;
      });
    },
    [scheduleRemoteSync]
  );

  const refreshFromServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await getUserSettings();
      suppressRemoteSyncRef.current = true;
      setPreferences((current) => mergePreferences(current, response));
      await persistLocal(mergePreferences(defaultState, response));
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[Preferences] Failed to fetch from API', apiError.message);
    } finally {
      suppressRemoteSyncRef.current = false;
      setIsSyncing(false);
    }
  }, [persistLocal]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    void refreshFromServer();
  }, [refreshFromServer]);

  const setTheme = useCallback(
    (mode: 'light' | 'dark') => {
      applyPreferences((current) => ({
        ...current,
        theme: mode
      }));
    },
    [applyPreferences]
  );

  const toggleNotification = useCallback(
    (key: keyof NotificationPreferences) => {
      applyPreferences((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          [key]: !current.notifications[key]
        }
      }));
    },
    [applyPreferences]
  );

  const toggleNotificationModel = useCallback(
    (model: keyof NotificationPreferences['models']) => {
      applyPreferences((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          models: {
            ...current.notifications.models,
            [model]: !current.notifications.models[model]
          }
        }
      }));
    },
    [applyPreferences]
  );

  const setNotifications = useCallback(
    (notifications: NotificationPreferences) => {
      applyPreferences((current) => ({
        ...current,
        notifications
      }));
    },
    [applyPreferences]
  );

  const refreshPushToken = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        applyPreferences(
          (current) => ({
            ...current,
            expoPushToken: token
          }),
          { skipRemoteSync: false }
        );
      }
      return token;
    } catch (error) {
      console.error('[Preferences] Failed to register push token', error);
      return null;
    }
  }, [applyPreferences]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    if (!preferences.expoPushToken) {
      void refreshPushToken();
    }
  }, [preferences.expoPushToken, refreshPushToken]);

  const theme = preferences.theme === 'dark' ? darkTheme : lightTheme;
  const navigationTheme = buildNavigationTheme(theme);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      theme,
      navigationTheme,
      isLoading,
      isSyncing,
      setTheme,
      toggleNotification,
      toggleNotificationModel,
      setNotifications,
      refreshFromServer,
      refreshPushToken
    }),
    [
      isLoading,
      isSyncing,
      navigationTheme,
      preferences,
      refreshFromServer,
      refreshPushToken,
      setTheme,
      theme,
      toggleNotification,
      toggleNotificationModel,
      setNotifications
    ]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
};
