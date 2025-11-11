import { useMemo } from 'react';

import { usePreferences } from '@/context/PreferencesContext';
import { useAuth } from '@/context/AuthContext';
import {
  DASHBOARD_DEFINITIONS,
  DEFAULT_DASHBOARD_ID,
  getDashboardDefinition,
  DashboardDefinition
} from '@/constants/dashboards';
import type { DashboardId } from '@/types/dashboard';

type UseDashboardResult = {
  selectedDashboardId: DashboardId;
  definition: DashboardDefinition;
  secretKey: string | null;
  hasSecretKey: boolean;
  apiOptions: { baseUrl: string };
  setDashboard: (dashboardId: DashboardId) => void;
};

export const useDashboard = (): UseDashboardResult => {
  const { preferences, setDashboard } = usePreferences();
  const { profile } = useAuth();

  const selectedDashboardId =
    (preferences.selectedDashboardId as DashboardId) ?? DEFAULT_DASHBOARD_ID;
  const definition = getDashboardDefinition(selectedDashboardId);

  const secretKey =
    definition.passkeyField === 'secondarySecretKey'
      ? profile?.secondarySecretKey ?? null
      : profile?.secretKey ?? null;

  const apiOptions = useMemo(
    () => ({
      baseUrl: definition.baseUrl
    }),
    [definition.baseUrl]
  );

  return {
    selectedDashboardId: definition.id,
    definition,
    secretKey,
    hasSecretKey: Boolean(secretKey),
    apiOptions,
    setDashboard
  };
};

export const getAvailableDashboards = () => Object.values(DASHBOARD_DEFINITIONS);
