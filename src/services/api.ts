import {
  BalanceResponse,
  DashboardSummary,
  OrderDetail,
  OrderSummary,
  PeriodFilter,
  UserPreferencesResponse,
  WithdrawHistoryItem,
  WithdrawHistoryResponse,
  WithdrawRequestPayload
} from '@/types/api';

export type ApiError = {
  message: string;
  status?: number;
};

const DEFAULT_DASHBOARD: DashboardSummary = {
  availableBalance: 54210.75,
  pendingBalance: 3180.2,
  currency: 'BRL',
  totalPaidAmount: 187500.4,
  paidOrdersCount: 386,
  averageTicket: 485.32,
  salesByMethod: {
    creditCard: 112300,
    pix: 59800,
    boleto: 15300
  }
};

const DASHBOARD_BY_PERIOD: Record<PeriodFilter, DashboardSummary> = {
  today: DEFAULT_DASHBOARD,
  '7d': {
    ...DEFAULT_DASHBOARD,
    totalPaidAmount: 48250.9,
    paidOrdersCount: 94,
    averageTicket: 513.31,
    availableBalance: 27680.3,
    pendingBalance: 1890.5,
    salesByMethod: {
      creditCard: 28000,
      pix: 16500,
      boleto: 3750
    }
  },
  '30d': {
    ...DEFAULT_DASHBOARD,
    totalPaidAmount: 187500.4,
    paidOrdersCount: 386,
    averageTicket: 485.32,
    availableBalance: 54210.75,
    pendingBalance: 3180.2,
    salesByMethod: {
      creditCard: 112300,
      pix: 59800,
      boleto: 15300
    }
  },
  '90d': {
    ...DEFAULT_DASHBOARD,
    totalPaidAmount: 525340.2,
    paidOrdersCount: 1078,
    averageTicket: 487.3,
    availableBalance: 154210.12,
    pendingBalance: 9120.4,
    salesByMethod: {
      creditCard: 320000,
      pix: 165000,
      boleto: 40340
    }
  },
  '1y': {
    ...DEFAULT_DASHBOARD,
    totalPaidAmount: 1940320.55,
    paidOrdersCount: 3980,
    averageTicket: 487.7,
    availableBalance: 402180.84,
    pendingBalance: 23890.74,
    salesByMethod: {
      creditCard: 1190300,
      pix: 632000,
      boleto: 118020
    }
  },
  custom: DEFAULT_DASHBOARD
};

const mockOrders: OrderDetail[] = [
  {
    id: 'ord-1001',
    code: 'MP-1001',
    customerName: 'Ana Souza',
    customerEmail: 'ana.souza@example.com',
    customerPhone: '+55 11 99876-1001',
    amount: 352.5,
    status: 'paid',
    statusLabel: 'Pago',
    createdAt: '2025-05-05T10:15:00Z',
    paymentMethod: 'Cartao de credito',
    items: [
      { id: 'ord-1001-item-1', name: 'Camisa feminina', quantity: 1, unitPrice: 199.9 },
      { id: 'ord-1001-item-2', name: 'Cinto couro', quantity: 1, unitPrice: 152.6 }
    ],
    timeline: [
      { status: 'created', label: 'Pedido criado', createdAt: '2025-05-05T10:00:00Z' },
      { status: 'paid', label: 'Pagamento confirmado', createdAt: '2025-05-05T10:15:00Z' },
      { status: 'processing', label: 'Separacao em andamento', createdAt: '2025-05-05T10:25:00Z' }
    ]
  },
  {
    id: 'ord-1002',
    code: 'MP-1002',
    customerName: 'Bruno Rocha',
    customerEmail: 'bruno.rocha@example.com',
    customerPhone: '+55 21 99700-2002',
    amount: 1280.9,
    status: 'pending',
    statusLabel: 'Aguardando pagamento',
    createdAt: '2025-05-04T14:40:00Z',
    paymentMethod: 'Pix',
    items: [
      { id: 'ord-1002-item-1', name: 'Notebook 14 polegadas', quantity: 1, unitPrice: 1280.9 }
    ],
    timeline: [
      { status: 'created', label: 'Pedido criado', createdAt: '2025-05-04T14:40:00Z' },
      { status: 'pending', label: 'Aguardando pagamento', createdAt: '2025-05-04T14:41:00Z' }
    ]
  },
  {
    id: 'ord-1003',
    code: 'MP-1003',
    customerName: 'Camila Alves',
    customerEmail: 'camila.alves@example.com',
    customerPhone: '+55 31 98220-3003',
    amount: 89.9,
    status: 'canceled',
    statusLabel: 'Cancelado',
    createdAt: '2025-05-03T09:18:00Z',
    paymentMethod: 'Boleto',
    items: [
      { id: 'ord-1003-item-1', name: 'Planner 2025', quantity: 1, unitPrice: 89.9 }
    ],
    timeline: [
      { status: 'created', label: 'Pedido criado', createdAt: '2025-05-03T09:18:00Z' },
      { status: 'canceled', label: 'Pedido cancelado', createdAt: '2025-05-06T09:18:00Z' }
    ]
  },
  {
    id: 'ord-1004',
    code: 'MP-1004',
    customerName: 'Daniel Lima',
    customerEmail: 'daniel.lima@example.com',
    customerPhone: '+55 41 99654-4004',
    amount: 620.45,
    status: 'paid',
    statusLabel: 'Pago',
    createdAt: '2025-05-02T16:05:00Z',
    paymentMethod: 'Pix',
    items: [
      { id: 'ord-1004-item-1', name: 'Kit ferramentas premium', quantity: 1, unitPrice: 620.45 }
    ],
    timeline: [
      { status: 'created', label: 'Pedido criado', createdAt: '2025-05-02T16:05:00Z' },
      { status: 'paid', label: 'Pagamento confirmado', createdAt: '2025-05-02T16:06:30Z' },
      { status: 'shipped', label: 'Pedido enviado', createdAt: '2025-05-03T08:12:00Z' }
    ]
  }
];

const summarizeOrder = (order: OrderDetail): OrderSummary => ({
  id: order.id,
  code: order.code,
  customerName: order.customerName,
  amount: order.amount,
  status: order.status,
  statusLabel: order.statusLabel,
  createdAt: order.createdAt,
  paymentMethod: order.paymentMethod
});

let storedPreferences: UserPreferencesResponse = {
  theme: 'light',
  language: 'pt-BR',
  notifications: {
    withdraws: true,
    sales: true,
    boletoPix: true,
    sound: true,
    models: {
      default: true,
      creative: false
    }
  },
  expoPushToken: null
};

const balanceState: BalanceResponse = {
  available: 54210.75,
  pending: 3180.2,
  blocked: 0,
  currency: 'BRL',
  withdrawFee: 3.5,
  minimumWithdraw: 50
};

let withdrawHistoryItems: WithdrawHistoryItem[] = [
  {
    id: 'wd-3001',
    createdAt: '2025-05-01T12:30:00Z',
    amount: 1200.5,
    status: 'paid',
    description: 'Saque automatico programado'
  },
  {
    id: 'wd-3000',
    createdAt: '2025-04-20T09:00:00Z',
    amount: 800.0,
    status: 'processing',
    description: 'Solicitacao manual via Pix'
  },
  {
    id: 'wd-2999',
    createdAt: '2025-04-02T18:45:00Z',
    amount: 1500.0,
    status: 'failed',
    description: 'Pix recusado pelo banco'
  }
];

const clonePreferences = (preferences: UserPreferencesResponse): UserPreferencesResponse => ({
  ...preferences,
  notifications: {
    ...preferences.notifications,
    models: { ...preferences.notifications.models }
  }
});

export const getDashboard = async (period: PeriodFilter): Promise<DashboardSummary> => {
  return Promise.resolve(DASHBOARD_BY_PERIOD[period] ?? DEFAULT_DASHBOARD);
};

export const getOrders = async (params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  const filtered = params?.status
    ? mockOrders.filter((order) => order.status === params.status)
    : mockOrders;

  return Promise.resolve({
    data: filtered.map(summarizeOrder),
    page: 1,
    totalPages: 1
  });
};

export const getOrderById = async (orderId: string): Promise<OrderDetail> => {
  const order = mockOrders.find((item) => item.id === orderId);

  if (!order) {
    throw {
      message: 'Pedido nao encontrado.',
      status: 404
    } satisfies ApiError;
  }

  return Promise.resolve(order);
};

export const getBalance = async (): Promise<BalanceResponse> => {
  return Promise.resolve({ ...balanceState });
};

export const requestWithdraw = async (payload: WithdrawRequestPayload) => {
  const id = `wd-${Date.now()}`;
  const amount = Math.max(0, payload.amount);

  balanceState.available = Math.max(0, balanceState.available - amount);
  balanceState.pending += amount;

  const entry: WithdrawHistoryItem = {
    id,
    createdAt: new Date().toISOString(),
    amount,
    status: 'processing',
    description: `Chave ${payload.pixKeyType} ${payload.pixKey}`
  };

  withdrawHistoryItems = [entry, ...withdrawHistoryItems];

  return Promise.resolve({
    id,
    status: entry.status
  });
};

export const getWithdrawHistory = async (): Promise<WithdrawHistoryResponse> => {
  return Promise.resolve({
    items: withdrawHistoryItems
  });
};

export const getUserSettings = async (): Promise<UserPreferencesResponse> => {
  return Promise.resolve(clonePreferences(storedPreferences));
};

export const updateUserSettings = async (
  payload: Partial<UserPreferencesResponse>
): Promise<UserPreferencesResponse> => {
  storedPreferences = clonePreferences({
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

  return Promise.resolve(clonePreferences(storedPreferences));
};

export const refreshSession = async () => {
  throw {
    message: 'Sessao de autenticacao desabilitada neste aplicativo demonstrativo.'
  } satisfies ApiError;
};

export const signIn = async () => {
  throw {
    message: 'Fluxo de login removido neste aplicativo demonstrativo.'
  } satisfies ApiError;
};

export const registerUnauthorizedHandler = () => {
  // no-op
};

export const setSessionToken = () => {
  // no-op
};

export const getRefreshToken = () => null;
