import { encode as base64Encode } from 'base-64';

import { ApiError, BalanceResponse, OrderDetail, OrderSummary, WithdrawHistoryItem } from '@/types/api';

const BASE_URL = 'https://api.v2.medusapay.com.br/v1';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

type MedusaTransaction = {
  id?: number | string;
  code?: string;
  tid?: string;
  status?: string;
  amount?: number | string;
  amount_cents?: number;
  paidAmount?: number | string;
  paymentMethod?: string;
  payment_method?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items?: Array<{
    id?: string | number;
    title?: string;
    name?: string;
    unitPrice?: number;
    unit_price?: number;
    amount?: number;
    quantity?: number;
  }>;
  metadata?: Record<string, unknown>;
  fees?: Array<Record<string, unknown>>;
  fee?: Array<Record<string, unknown>> | Record<string, unknown>;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: QueryParams;
};

type ClientOptions = {
  baseUrl?: string;
};

const normalizeBaseUrl = (baseUrl?: string) => {
  const target = baseUrl ?? BASE_URL;
  return target.endsWith('/') ? target.slice(0, -1) : target;
};

const buildUrl = (path: string, query?: QueryParams, baseUrl?: string) => {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  if (!query) return `${normalizedBase}${path}`;
  const searchParams = Object.entries(query).reduce<string[]>((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    acc.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    return acc;
  }, []);
  return `${normalizedBase}${path}${searchParams.length ? `?${searchParams.join('&')}` : ''}`;
};

const buildAuthHeader = (secretKey: string) => `Basic ${base64Encode(`${secretKey}:x`)}`;

const getNestedValue = (source: unknown, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
};

const sanitizeNumberString = (value: string) =>
  value
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(sanitizeNumberString(value));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object') {
    if ('amount' in (value as Record<string, unknown>)) {
      return toNumber((value as Record<string, unknown>).amount);
    }
    if ('value' in (value as Record<string, unknown>)) {
      return toNumber((value as Record<string, unknown>).value);
    }
  }
  return null;
};

const fromMedusaMoney = (value: unknown) => {
  const numeric = toNumber(value);
  if (numeric === null) return 0;
  if (Math.abs(numeric) >= 100 || Number.isInteger(numeric)) {
    return numeric / 100;
  }
  return numeric;
};

const pickMoney = (payload: unknown, paths: string[], fallbackMatches: string[] = []): number => {
  for (const path of paths) {
    const value = getNestedValue(payload, path);
    if (value !== undefined && value !== null) {
      return fromMedusaMoney(value);
    }
  }

  if (!payload || typeof payload !== 'object' || fallbackMatches.length === 0) {
    return 0;
  }

  const loweredMatches = fallbackMatches.map((match) => match.toLowerCase());
  const queue: unknown[] = [payload];
  const visited = new Set<unknown>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const [key, value] of Object.entries(current)) {
      if (loweredMatches.some((match) => key.toLowerCase().includes(match))) {
        const numeric = toNumber(value);
        if (numeric !== null) {
          return fromMedusaMoney(numeric);
        }
      }

      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return 0;
};

const extractArray = (payload: unknown): MedusaTransaction[] => {
  if (Array.isArray(payload)) {
    return payload as MedusaTransaction[];
  }

  const queue: unknown[] = [payload];
  const visited = new Set<unknown>();
  const candidateKeys = ['data', 'items', 'transactions', 'results', 'response', 'collection'];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;
    if (visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      return current as MedusaTransaction[];
    }

    for (const key of candidateKeys) {
      const value = (current as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return value as MedusaTransaction[];
      }
      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        return value as MedusaTransaction[];
      }
      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return [];
};

const unwrapTransaction = (payload: unknown): MedusaTransaction => {
  if (payload && typeof payload === 'object') {
    if ('transaction' in (payload as Record<string, unknown>)) {
      return (payload as Record<string, unknown>).transaction as MedusaTransaction;
    }
    if ('data' in (payload as Record<string, unknown>)) {
      return unwrapTransaction((payload as Record<string, unknown>).data);
    }
  }
  return (payload ?? {}) as MedusaTransaction;
};

const mapPaymentMethod = (value?: string) => {
  if (!value) return 'Indefinido';
  const normalized = value.toLowerCase();
  if (normalized.includes('credit')) return 'Cartao de credito';
  if (normalized.includes('boleto')) return 'Boleto';
  if (normalized.includes('pix')) return 'Pix';
  return value;
};

const mapStatusLabel = (status?: string) => {
  switch (status) {
    case 'processing':
      return 'Processando';
    case 'authorized':
      return 'Autorizada';
    case 'paid':
      return 'Paga';
    case 'waiting_payment':
      return 'Aguardando pagamento';
    case 'refunded':
      return 'Estornada';
    case 'refused':
      return 'Recusada';
    case 'canceled':
      return 'Cancelada';
    case 'in_protest':
      return 'Em contestacao';
    case 'partially_paid':
      return 'Parcialmente paga';
    default:
      return status ?? 'Desconhecido';
  }
};

const mapTransferStatus = (status?: string): WithdrawHistoryItem['status'] => {
  switch ((status ?? '').toLowerCase()) {
    case 'success':
    case 'paid':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'canceled';
    default:
      return 'processing';
  }
};

type FeeEntry = {
  label: string;
  amount: number;
};

type FeeSource = {
  label?: unknown;
  description?: unknown;
  type?: unknown;
  amount?: unknown;
  amount_cents?: unknown;
  value?: unknown;
  total?: unknown;
};

const coerceFeeArray = (value: unknown): FeeSource[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is FeeSource => Boolean(item && typeof item === 'object'));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).map(([label, extra]) => {
      if (extra && typeof extra === 'object') {
        return { label, ...(extra as Record<string, unknown>) };
      }
      return { label, amount: extra as unknown };
    });
  }

  return [];
};

const mapFees = (transaction: MedusaTransaction): FeeEntry[] => {
  const raw = transaction.fees ?? transaction.fee;
  if (!raw) return [];

  const entries = coerceFeeArray(raw);
  return entries
    .map((entry, index) => {
      const label =
        (typeof entry.label === 'string' && entry.label) ||
        (typeof entry.description === 'string' && entry.description) ||
        (typeof entry.type === 'string' && entry.type) ||
        `Taxa ${index + 1}`;
      const amount = fromMedusaMoney(
        (entry.amount as unknown) ??
          (entry.amount_cents as unknown) ??
          (entry.value as unknown) ??
          (entry.total as unknown)
      );
      if (!amount) return null;
      return { label, amount };
    })
    .filter((fee): fee is FeeEntry => Boolean(fee));
};

const mapTransactionToOrder = (transaction: MedusaTransaction): OrderDetail => {
  const amount = fromMedusaMoney(
    transaction.paidAmount ??
      transaction.amount ??
      transaction.amount_cents ??
      (transaction as Record<string, unknown>).amountInCents
  );

  const createdAt =
    transaction.createdAt ??
    transaction.created_at ??
    transaction.updatedAt ??
    transaction.updated_at ??
    new Date().toISOString();

  return {
    id: String(transaction.id ?? transaction.code ?? transaction.tid ?? Date.now()),
    code: String(transaction.code ?? transaction.id ?? transaction.tid ?? 'transacao'),
    customerName: transaction.customer?.name ?? 'Cliente',
    customerEmail: transaction.customer?.email,
    customerPhone: transaction.customer?.phone,
    amount,
    status: transaction.status ?? 'processing',
    statusLabel: mapStatusLabel(transaction.status),
    createdAt,
    paymentMethod: mapPaymentMethod(transaction.paymentMethod ?? transaction.payment_method),
    items:
      transaction.items?.map((item) => ({
        id: String(item.id ?? item.title ?? item.name ?? Math.random()),
        name: item.name ?? item.title ?? 'Item',
        quantity: item.quantity ?? 1,
        unitPrice: fromMedusaMoney(item.unitPrice ?? item.unit_price ?? item.amount)
      })) ?? [],
    metadata: transaction.metadata,
    fees: mapFees(transaction),
    timeline: []
  };
};

const handleErrorResponse = async (response: Response): Promise<ApiError> => {
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    try {
      parsed = await response.text();
    } catch {
      parsed = null;
    }
  }

  const status = response.status;
  const defaultMessage =
    status === 401 || status === 403
      ? 'Secret Key invalida ou nao autorizada.'
      : 'Erro na API da Medusa Pay.';

  let message =
    (typeof parsed === 'object' && parsed && 'message' in parsed
      ? (parsed as { message?: string }).message
      : undefined) ?? defaultMessage;

  if (status === 401 && message && message.toUpperCase().includes('RL-2')) {
    message = 'Token invalido (RL-2). Verifique sua Secret Key e tente novamente.';
  }

  return {
    message,
    status,
    details: parsed
  };
};

const request = async <T>(
  path: string,
  secretKey: string,
  options?: RequestOptions & ClientOptions
): Promise<T> => {
  const url = buildUrl(path, options?.query, options?.baseUrl);
  const headers: Record<string, string> = {
    Authorization: buildAuthHeader(secretKey),
    Accept: 'application/json'
  };

  let body: string | undefined;
  if (options?.body) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options?.method ?? 'GET',
      headers,
      body
    });
  } catch (error) {
    throw {
      message: 'Nao foi possivel conectar ao gateway.',
      details: error
    } satisfies ApiError;
  }

  if (!response.ok) {
    throw await handleErrorResponse(response);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
};

export const getBalance = async (
  secretKey: string,
  params?: { recipientId?: string | number | null },
  options?: ClientOptions
): Promise<BalanceResponse> => {
  const hasRecipient =
    params?.recipientId !== undefined && params?.recipientId !== null && params?.recipientId !== '';

  const payload = await request<Record<string, unknown>>('/balance/available', secretKey, {
    query: hasRecipient ? { recipientId: params?.recipientId } : undefined,
    baseUrl: options?.baseUrl
  });

  const available = pickMoney(
    payload,
    [
      'available',
      'available.amount',
      'balance.available',
      'balance.available.amount',
      'data.available',
      'balances.available'
    ],
    ['available', 'saldo', 'available_balance', 'saldo_disponivel']
  );

  const pending = pickMoney(
    payload,
    [
      'waitingFunds',
      'waiting_funds',
      'pending',
      'balance.pending',
      'data.waitingFunds',
      'data.pending'
    ],
    ['waiting', 'pending', 'aguardando']
  );

  const blocked = pickMoney(
    payload,
    ['blocked', 'balance.blocked', 'data.blocked'],
    ['blocked', 'bloqueado']
  );

  const withdrawFee = pickMoney(
    payload,
    [
      'withdrawFee',
      'withdraw_fee',
      'fees.withdraw',
      'fees.withdraw_fee',
      'transferFee',
      'transfer_fee'
    ],
    ['fee', 'taxa', 'transfer_fee']
  );
  const minimumWithdraw = pickMoney(
    payload,
    ['minimumWithdraw', 'minimum_withdraw', 'withdraw.minimum'],
    ['minimum', 'minimo']
  );

  return {
    available,
    pending,
    blocked,
    currency:
      (payload.currency as string) ??
      (getNestedValue(payload, 'balance.currency') as string) ??
      'BRL',
    withdrawFee,
    minimumWithdraw
  };
};

export const getTransactions = async (
  secretKey: string,
  params?: QueryParams,
  options?: ClientOptions
): Promise<OrderSummary[]> => {
  const query: QueryParams = {
    page: 1,
    count: 50,
    sort: 'desc',
    ...params
  };

  const response = await request<unknown>('/transactions', secretKey, {
    query,
    baseUrl: options?.baseUrl
  });
  const transactions = extractArray(response);
  return transactions.map((transaction) => {
    const detail = mapTransactionToOrder(transaction);
    const { items, timeline, metadata, ...summary } = detail;
    return summary;
  });
};

export const getTransactionById = async (
  secretKey: string,
  transactionId: string,
  options?: ClientOptions
) => {
  const payload = await request<unknown>(`/transactions/${transactionId}`, secretKey, {
    baseUrl: options?.baseUrl
  });
  return mapTransactionToOrder(unwrapTransaction(payload));
};

export const getCompany = async (secretKey: string, options?: ClientOptions) => {
  return request<Record<string, unknown>>('/company', secretKey, {
    baseUrl: options?.baseUrl
  });
};

export const getRecipients = async (secretKey: string, options?: ClientOptions) => {
  return request<Record<string, unknown>>('/recipients', secretKey, {
    baseUrl: options?.baseUrl
  });
};

export const getCustomers = async (secretKey: string, options?: ClientOptions) => {
  return request<Record<string, unknown>>('/customers', secretKey, {
    baseUrl: options?.baseUrl
  });
};

const normalizePixKeyType = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes('cpf')) return 'cpf';
  if (normalized.includes('cnpj')) return 'cnpj';
  if (normalized.includes('email')) return 'email';
  if (normalized.includes('telefone') || normalized.includes('phone')) return 'phone';
  if (normalized.includes('aleat')) return 'random';
  if (normalized.includes('qr')) return 'qr_code';
  return normalized;
};

export const createTransfer = async (
  secretKey: string,
  payload: {
    amount: number;
    pixKey?: string;
    pixKeyType?: string;
    recipientId?: number;
    postbackUrl?: string;
  },
  options?: ClientOptions
) => {
  return request<Record<string, unknown>>('/transfers', secretKey, {
    method: 'POST',
    body: {
      amount: payload.amount,
      pixKey: payload.pixKey,
      pixKeyType: normalizePixKeyType(payload.pixKeyType),
      recipientId: payload.recipientId,
      postbackUrl: payload.postbackUrl
    },
    baseUrl: options?.baseUrl
  });
};

export const getTransfers = async (
  secretKey: string,
  options?: ClientOptions
): Promise<WithdrawHistoryItem[]> => {
  const response = await request<unknown>('/transfers', secretKey, {
    baseUrl: options?.baseUrl
  });
  const transfers = extractArray(response);

  return transfers.map((transfer) => ({
    id: String((transfer as Record<string, unknown>).id ?? Math.random()),
    createdAt:
      (transfer as Record<string, unknown>).createdAt?.toString() ??
      (transfer as Record<string, unknown>).created_at?.toString() ??
      new Date().toISOString(),
    amount: fromMedusaMoney(
      (transfer as Record<string, unknown>).amount ??
        (transfer as Record<string, unknown>).amount_cents
    ),
    status: mapTransferStatus((transfer as Record<string, unknown>).status?.toString()),
    description: (transfer as Record<string, unknown>).failReason?.toString()
  }));
};
