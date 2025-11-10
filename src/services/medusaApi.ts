import { Buffer } from 'buffer';

import { ApiError, BalanceResponse, OrderDetail, OrderSummary, WithdrawHistoryItem } from '@/types/api';

const BASE_URL = 'https://api.v2.medusapay.com.br/v1';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

type MedusaTransaction = {
  id?: number | string;
  code?: string;
  status?: string;
  amount?: number | string;
  paidAmount?: number | string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
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
};

type MedusaTransactionsResponse = {
  data?: MedusaTransaction[];
  transactions?: MedusaTransaction[];
  items?: MedusaTransaction[];
};

type MedusaBalanceResponse = {
  available?: number;
  availableAmount?: number;
  waitingFunds?: number;
  waiting_funds?: number;
  pending?: number;
  blocked?: number;
  currency?: string;
  withdrawFee?: number;
  transferFee?: number;
  minimumWithdraw?: number;
  minimum_withdraw?: number;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: QueryParams;
};

const buildUrl = (path: string, query?: QueryParams) => {
  if (!query) return `${BASE_URL}${path}`;
  const searchParams = Object.entries(query).reduce<string[]>((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    acc.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    return acc;
  }, []);
  return `${BASE_URL}${path}${searchParams.length ? `?${searchParams.join('&')}` : ''}`;
};

const buildAuthHeader = (secretKey: string) =>
  `Basic ${Buffer.from(`${secretKey}:x`).toString('base64')}`;

const fromCents = (value?: number | string | null) => {
  if (value === null || value === undefined) return 0;
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numeric)) return 0;
  return numeric / 100;
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

const mapPaymentMethod = (paymentMethod?: string) => {
  switch (paymentMethod) {
    case 'credit_card':
      return 'Cartao de credito';
    case 'boleto':
      return 'Boleto';
    case 'pix':
      return 'Pix';
    default:
      return paymentMethod ?? 'Desconhecido';
  }
};

const mapTransferStatus = (status?: string): WithdrawHistoryItem['status'] => {
  switch (status) {
    case 'success':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'canceled';
    default:
      return 'processing';
  }
};

const mapTransactionToOrder = (transaction: MedusaTransaction): OrderDetail => {
  const amount =
    fromCents(transaction.paidAmount ?? transaction.amount) || 0;

  return {
    id: String(transaction.id ?? transaction.code ?? Date.now()),
    code: String(transaction.code ?? transaction.id ?? 'transacao'),
    customerName: transaction.customer?.name ?? 'Cliente',
    customerEmail: transaction.customer?.email,
    customerPhone: transaction.customer?.phone,
    amount,
    status: transaction.status ?? 'processing',
    statusLabel: mapStatusLabel(transaction.status),
    createdAt: transaction.createdAt ?? new Date().toISOString(),
    paymentMethod: mapPaymentMethod(transaction.paymentMethod),
    items:
      transaction.items?.map((item) => ({
        id: String(item.id ?? item.title ?? item.name ?? Math.random()),
        name: item.name ?? item.title ?? 'Item',
        quantity: item.quantity ?? 1,
        unitPrice: fromCents(item.unitPrice ?? item.unit_price ?? item.amount)
      })) ?? [],
    metadata: transaction.metadata,
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

  const message =
    (typeof parsed === 'object' && parsed && 'message' in parsed
      ? (parsed as { message?: string }).message
      : undefined) ?? defaultMessage;

  return {
    message,
    status,
    details: parsed
  };
};

const request = async <T>(path: string, secretKey: string, options?: RequestOptions): Promise<T> => {
  const url = buildUrl(path, options?.query);
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

export const getBalance = async (secretKey: string): Promise<BalanceResponse> => {
  const payload = await request<MedusaBalanceResponse>('/balance/available', secretKey);

  return {
    available: fromCents(payload.available ?? payload.availableAmount ?? 0),
    pending: fromCents(payload.waitingFunds ?? payload.waiting_funds ?? payload.pending ?? 0),
    blocked: fromCents(payload.blocked ?? 0),
    currency: payload.currency ?? 'BRL',
    withdrawFee: fromCents(payload.withdrawFee ?? payload.transferFee ?? 0),
    minimumWithdraw: fromCents(payload.minimumWithdraw ?? payload.minimum_withdraw ?? 0)
  };
};

export const getTransactions = async (
  secretKey: string,
  params?: QueryParams
): Promise<OrderSummary[]> => {
  const response = await request<MedusaTransactionsResponse>('/transactions', secretKey, {
    query: params
  });
  const transactions = response.data ?? response.transactions ?? response.items ?? [];
  return transactions.map((transaction) => {
    const detail = mapTransactionToOrder(transaction);
    const { items, timeline, metadata, ...summary } = detail;
    return summary;
  });
};

export const getTransactionById = async (secretKey: string, transactionId: string) => {
  const payload = await request<MedusaTransaction>(`/transactions/${transactionId}`, secretKey);
  return mapTransactionToOrder(payload);
};

export const getCompany = async (secretKey: string) => {
  return request<Record<string, unknown>>('/company', secretKey);
};

export const getRecipients = async (secretKey: string) => {
  return request<Record<string, unknown>>('/recipients', secretKey);
};

export const getCustomers = async (secretKey: string) => {
  return request<Record<string, unknown>>('/customers', secretKey);
};

export const createTransfer = async (
  secretKey: string,
  payload: {
    amount: number;
    pixKey?: string;
    recipientId?: number;
    postbackUrl?: string;
  }
) => {
  return request<Record<string, unknown>>('/transfers', secretKey, {
    method: 'POST',
    body: payload
  });
};

export const getTransfers = async (secretKey: string): Promise<WithdrawHistoryItem[]> => {
  const response = await request<{ data?: Array<Record<string, unknown>>; transfers?: Array<Record<string, unknown>> }>(
    '/transfers',
    secretKey
  );
  const transfers = response.data ?? response.transfers ?? [];

  return transfers.map((transfer) => ({
    id: String(transfer.id ?? Math.random()),
    createdAt: (transfer.createdAt as string) ?? new Date().toISOString(),
    amount: fromCents((transfer.amount as number) ?? 0),
    status: mapTransferStatus(transfer.status as string | undefined),
    description: transfer.failReason ? String(transfer.failReason) : undefined
  }));
};
