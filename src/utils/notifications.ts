import { formatCurrencyBRL } from '@/utils/format';

export type NotificationTemplateKey = 'default' | 'creative';

export type NotificationType =
  | 'sale'
  | 'pix_generated'
  | 'pix_paid'
  | 'boleto_generated'
  | 'withdraw'
  | 'generic';

type NotificationPayload = Record<string, unknown>;

export type NotificationTemplate = {
  title: string | ((payload: NotificationPayload) => string);
  body: (payload: NotificationPayload) => string;
};

type TemplateDictionary = Record<NotificationType, NotificationTemplate>;

const pickVariant = (variants: string[]) =>
  variants[Math.floor(Math.random() * variants.length)];

const formatAmount = (value: unknown) => `Valor ${formatCurrencyBRL(Number(value) || 0)}`;

const resolvePaymentMethod = (paymentMethod: unknown) => {
  if (typeof paymentMethod !== 'string') return 'Venda';
  const normalized = paymentMethod.toLowerCase();
  if (normalized.includes('pix')) return 'Pix';
  if (normalized.includes('boleto')) return 'Boleto';
  if (normalized.includes('cart') || normalized.includes('credito') || normalized.includes('credit')) {
    return 'Cartao';
  }
  return 'Venda';
};

const saleCreativeTitles = [
  '🎉 Sabe o que acabou de pingar, ne?',
  '💸 Calma Elon Musk to chegando',
  '🚀 Venda nova no painel agora',
  '🔥 Mais uma venda confirmada',
  '🪼 Medusa avisou: entrou valor'
];

const pixGeneratedCreativeTitles = [
  '⚡ Novo Pix gerado! Estamos na torcida...',
  '📲 Pix gerado, sera que vao pagar?',
  '🪼 Seu cliente acabou de gerar um PIX',
  '💚 Pix novinho pronto para pagamento',
  '🔔 Pix criado com sucesso agora'
];

const boletoGeneratedCreativeTitles = [
  '🧾 Boleto emitido com sucesso',
  '📬 Boleto novo no radar',
  '🎯 Mais um boleto foi gerado',
  '💼 Boleto criado e aguardando pagamento',
  '🪼 Boleto pronto no seu painel'
];

export const NOTIFICATION_TEMPLATES: Record<NotificationTemplateKey, TemplateDictionary> = {
  default: {
    sale: {
      title: ({ paymentMethod }) => `${resolvePaymentMethod(paymentMethod)} aprovado`,
      body: ({ amount }) => formatAmount(amount)
    },
    pix_generated: {
      title: 'Pix gerado',
      body: ({ amount }) => formatAmount(amount)
    },
    pix_paid: {
      title: 'Pix pago',
      body: ({ amount }) => formatAmount(amount)
    },
    boleto_generated: {
      title: 'Boleto gerado',
      body: ({ amount }) => formatAmount(amount)
    },
    withdraw: {
      title: 'Solicitacao de saque',
      body: ({ amount }) => formatAmount(amount)
    },
    generic: {
      title: 'Medusa Pay',
      body: ({ message }) => String(message ?? 'Voce recebeu uma nova notificacao.')
    }
  },
  creative: {
    sale: {
      title: () => pickVariant(saleCreativeTitles),
      body: ({ amount, paymentMethod }) =>
        `${formatAmount(amount)} • ${resolvePaymentMethod(paymentMethod)}`
    },
    pix_generated: {
      title: () => pickVariant(pixGeneratedCreativeTitles),
      body: ({ amount }) => formatAmount(amount)
    },
    pix_paid: {
      title: () => pickVariant(['✅ Pix caiu!', '💚 Pix confirmado!', '⚡ Pix pago no ato!', '🪼 Pix entrou!', '🎯 Pix compensado!']),
      body: ({ amount }) => formatAmount(amount)
    },
    boleto_generated: {
      title: () => pickVariant(boletoGeneratedCreativeTitles),
      body: ({ amount }) => formatAmount(amount)
    },
    withdraw: {
      title: () => pickVariant(['🏦 Saque solicitado', '📤 Saque em processamento', '🪼 Saque no fluxo', '💸 Pedido de saque recebido', '⏳ Saque em andamento']),
      body: ({ amount }) => formatAmount(amount)
    },
    generic: {
      title: () => pickVariant(['🪼 Medusa Pay', '🔔 Medusa Pay', '⚡ Medusa Pay', '💚 Medusa Pay', '🎉 Medusa Pay']),
      body: ({ message }) => String(message ?? 'Chegou novidade no app.')
    }
  }
};
