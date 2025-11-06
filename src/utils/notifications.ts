import { formatCurrencyBRL } from '@/utils/format';

export type NotificationTemplateKey = 'default' | 'creative';

export type NotificationType =
  | 'sale'
  | 'pix_generated'
  | 'pix_paid'
  | 'boleto_generated'
  | 'withdraw'
  | 'generic';

export type NotificationTemplate = {
  title: string;
  body: (payload: Record<string, unknown>) => string;
};

type TemplateDictionary = Record<NotificationType, NotificationTemplate>;

export const NOTIFICATION_TEMPLATES: Record<NotificationTemplateKey, TemplateDictionary> = {
  default: {
    sale: {
      title: 'Nova venda aprovada',
      body: ({ amount }) =>
        `Sabe o que acabou de pingar, né? 💸 ${formatCurrencyBRL(Number(amount) || 0)} confirmado.`
    },
    pix_generated: {
      title: 'Pix gerado',
      body: ({ amount }) =>
        `Novo Pix gerado! Estamos na torcida pelos ${formatCurrencyBRL(Number(amount) || 0)}.`
    },
    pix_paid: {
      title: 'Pix pago',
      body: ({ amount }) =>
        `Pix pago com sucesso! ${formatCurrencyBRL(Number(amount) || 0)} já disponível pra você.`
    },
    boleto_generated: {
      title: 'Boleto emitido',
      body: ({ amount }) =>
        `Novo boleto saindo do forno 🔥 Valor: ${formatCurrencyBRL(Number(amount) || 0)}.`
    },
    withdraw: {
      title: 'Solicitação de saque',
      body: ({ amount }) =>
        `Pedido de saque recebido. Acompanhe ${formatCurrencyBRL(Number(amount) || 0)} no histórico.`
    },
    generic: {
      title: 'MedusaPay',
      body: ({ message }) => String(message ?? 'Você tem uma atualização na MedusaPay.')
    }
  },
  creative: {
    sale: {
      title: 'Ka-ching!',
      body: ({ amount }) =>
        `Calma Elon Musk, tô chegando 🚀 Entrada de ${formatCurrencyBRL(Number(amount) || 0)}!`
      },
    pix_generated: {
      title: 'Pix novinho na área',
      body: ({ amount }) =>
        `Fica de olho: Pix gerado em ${formatCurrencyBRL(Number(amount) || 0)}. Logo cai.`
    },
    pix_paid: {
      title: 'Pix confirmado 💚',
      body: ({ amount }) =>
        `É sobre isso! ${formatCurrencyBRL(Number(amount) || 0)} já tá na conta.`
    },
    boleto_generated: {
      title: 'Boleto na pista',
      body: ({ amount }) =>
        `Amarro outro boleto? 😎 Valor de ${formatCurrencyBRL(Number(amount) || 0)} liberado.`
    },
    withdraw: {
      title: 'Saque na esteira',
      body: ({ amount }) =>
        `Pix indo com carinho ❤️ Valor de ${formatCurrencyBRL(Number(amount) || 0)} a caminho.`
    },
    generic: {
      title: 'MedusaPay',
      body: ({ message }) => String(message ?? 'Chegou novidade quente na MedusaPay 🔥')
    }
  }
};
