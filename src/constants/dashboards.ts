import { DashboardId, DashboardPasskeyField } from '@/types/dashboard';

export type DashboardDefinition = {
  id: DashboardId;
  label: string;
  shortLabel: string;
  description: string;
  baseUrl: string;
  docsFile?: string;
  passkeyField: DashboardPasskeyField;
  passkeyLabel: string;
};

export const DEFAULT_DASHBOARD_ID: DashboardId = 'dashboard-1';

export const DASHBOARD_DEFINITIONS: Record<DashboardId, DashboardDefinition> = {
  'dashboard-1': {
    id: 'dashboard-1',
    label: 'Dashboard 1 - Medusa Pay',
    shortLabel: 'Dashboard 1',
    description: 'API oficial ja conectada ao app (api.v2.medusapay.com.br).',
    baseUrl: 'https://api.v2.medusapay.com.br/v1',
    passkeyField: 'secretKey',
    passkeyLabel: 'Passkey 1'
  },
  'dashboard-2': {
    id: 'dashboard-2',
    label: 'Dashboard 2 - Ecossistema Medusa',
    shortLabel: 'Dashboard 2',
    description:
      'API descrita no arquivo ecossistema_medusa_docs_fetch_2025-11-11T03-06-03-812Z.json (api.shieldtecnologia.com).',
    baseUrl: 'https://api.shieldtecnologia.com/v1',
    docsFile: 'ecossistema_medusa_docs_fetch_2025-11-11T03-06-03-812Z.json',
    passkeyField: 'secondarySecretKey',
    passkeyLabel: 'Passkey 2'
  }
};

export const DASHBOARD_LIST: DashboardDefinition[] = Object.values(DASHBOARD_DEFINITIONS);

export const getDashboardDefinition = (id?: DashboardId) =>
  (id && DASHBOARD_DEFINITIONS[id]) ?? DASHBOARD_DEFINITIONS[DEFAULT_DASHBOARD_ID];
