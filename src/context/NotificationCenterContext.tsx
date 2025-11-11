import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, OrderSummary } from '@/types/api';
import { sendLocalNotification } from '@/services/notifications';
import { useDashboard } from '@/hooks/useDashboard';
import { getTransactions } from '@/services/medusaApi';

const STORAGE_KEY_PREFIX = '@medusa_read_notifications_v1';
const DEFAULT_POLL_INTERVAL_MS = 20000;
const RATE_LIMIT_BACKOFF_MS = 120000;
const MAX_POLL_INTERVAL_MS = 5 * 60 * 1000;

type SaleNotification = {
  id: string;
  amount: number;
  paymentMethod?: string;
  createdAt: string;
  customerName?: string;
  isRead: boolean;
};

type NotificationCenterValue = {
  notifications: SaleNotification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationCenterContext = createContext<NotificationCenterValue | undefined>(undefined);

export const NotificationCenterProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { secretKey, apiOptions, selectedDashboardId } = useDashboard();
  const [notifications, setNotifications] = useState<SaleNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const storageKey = `${STORAGE_KEY_PREFIX}:${selectedDashboardId}`;

  useEffect(() => {
    const loadReadIds = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        setReadIds(stored ? new Set(JSON.parse(stored) as string[]) : new Set());
      } catch (error) {
        console.warn('[NotificationCenter] Failed to load read ids', error);
      }
    };
    void loadReadIds();
  }, [storageKey]);

  const persistReadIds = useCallback(
    async (ids: Set<string>) => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(ids)));
      } catch (error) {
        console.warn('[NotificationCenter] Failed to persist read ids', error);
      }
    },
    [storageKey]
  );

  const syncNotifications = useCallback(
    (data: OrderSummary[]) => {
      const paid = data.filter((item) => item.status === 'paid');
      const mapped = paid.map<SaleNotification>((item) => ({
        id: item.id,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        createdAt: item.createdAt,
        customerName: item.customerName,
        isRead: readIds.has(item.id)
      }));

      setNotifications((prev) => {
        const map = new Map<string, SaleNotification>();
        [...prev, ...mapped].forEach((notification) => {
          map.set(notification.id, { ...notification, isRead: readIds.has(notification.id) });
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      if (!initialLoadRef.current) {
        mapped.forEach((notification) => {
          if (!seenIdsRef.current.has(notification.id)) {
            seenIdsRef.current.add(notification.id);
            void sendLocalNotification('sale', {
              amount: notification.amount,
              customer: notification.customerName,
              paymentMethod: notification.paymentMethod
            });
          }
        });
      } else {
        mapped.forEach((notification) => seenIdsRef.current.add(notification.id));
        initialLoadRef.current = false;
      }
    },
    [readIds]
  );

  useEffect(() => {
    if (!secretKey) {
      setNotifications([]);
      seenIdsRef.current.clear();
      initialLoadRef.current = true;
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let failureCount = 0;
    let nextDelay = DEFAULT_POLL_INTERVAL_MS;

    const scheduleNextFetch = (delay: number) => {
      if (cancelled) return;
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        timeout = undefined;
        void fetchTransactions();
      }, delay);
    };

    const fetchTransactions = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const data = await getTransactions(secretKey, { count: 20 }, apiOptions);
        if (!cancelled) {
          syncNotifications(data);
        }
        failureCount = 0;
        nextDelay = DEFAULT_POLL_INTERVAL_MS;
      } catch (error) {
        const apiError = error as ApiError;
        const isRateLimited = apiError?.status === 429;
        failureCount += 1;
        nextDelay = isRateLimited
          ? RATE_LIMIT_BACKOFF_MS
          : Math.min(DEFAULT_POLL_INTERVAL_MS * 2 ** failureCount, MAX_POLL_INTERVAL_MS);

        const warningMessage = isRateLimited
          ? '[NotificationCenter] Notifications fetch rate limited. Backing off before retry.'
          : '[NotificationCenter] Failed to fetch notifications';
        console.warn(warningMessage, error);
      } finally {
        inFlight = false;
        if (!cancelled) {
          scheduleNextFetch(nextDelay);
        }
      }
    };

    void fetchTransactions();
    return () => {
      cancelled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [apiOptions, secretKey, selectedDashboardId, syncNotifications]);

  const markNotificationAsRead = useCallback(
    (id: string) => {
      if (readIds.has(id)) return;
      const next = new Set(readIds);
      next.add(id);
      setReadIds(next);
      void persistReadIds(next);
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification))
      );
    },
    [persistReadIds, readIds]
  );

  const markAllAsRead = useCallback(() => {
    const allIds = new Set([...readIds, ...notifications.map((notification) => notification.id)]);
    setReadIds(allIds);
    void persistReadIds(allIds);
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  }, [notifications, persistReadIds, readIds]);

  const value = useMemo<NotificationCenterValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
      markNotificationAsRead,
      markAllAsRead
    }),
    [markNotificationAsRead, markAllAsRead, notifications]
  );

  return <NotificationCenterContext.Provider value={value}>{children}</NotificationCenterContext.Provider>;
};

export const useNotificationCenter = () => {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx) throw new Error('useNotificationCenter must be used within NotificationCenterProvider');
  return ctx;
};
