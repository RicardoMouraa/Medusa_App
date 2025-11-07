export type PeriodFilter = 'today' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  expiresIn?: number;
}

export interface DashboardSummary {
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  totalPaidAmount: number;
  paidOrdersCount: number;
  averageTicket: number;
  salesByMethod: {
    creditCard: number;
    pix: number;
    boleto: number;
    [key: string]: number;
  };
}

export interface OrderSummary {
  id: string;
  code: string;
  customerName?: string;
  amount: number;
  status: string;
  statusLabel?: string;
  createdAt: string;
  paymentMethod?: string;
}

export interface OrderDetail extends OrderSummary {
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  metadata?: Record<string, unknown>;
  customerEmail?: string;
  customerPhone?: string;
  timeline?: Array<{
    label: string;
    createdAt: string;
    status: string;
  }>;
}

export interface BalanceResponse {
  available: number;
  pending: number;
  blocked?: number;
  currency: string;
  withdrawFee: number;
  minimumWithdraw?: number;
}

export interface WithdrawRequestPayload {
  pixKeyType: string;
  pixKey: string;
  amount: number;
}

export interface WithdrawHistoryItem {
  id: string;
  createdAt: string;
  amount: number;
  status: 'processing' | 'paid' | 'failed' | 'canceled';
  description?: string;
}

export interface WithdrawHistoryResponse {
  items: WithdrawHistoryItem[];
}

export interface NotificationPreferences {
  withdraws: boolean;
  sales: boolean;
  boletoPix: boolean;
  sound: boolean;
  models: {
    default: boolean;
    creative: boolean;
  };
}

export interface UserPreferencesResponse {
  theme: 'light' | 'dark';
  language: string;
  notifications: NotificationPreferences;
  expoPushToken?: string | null;
}
