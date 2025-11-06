import { format, formatRelative, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrencyBRL = (value: number, fallback = 'R$ 0,00') => {
  if (Number.isNaN(value) || value === null || value === undefined) {
    return fallback;
  }
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  } catch {
    return fallback;
  }
};

export const formatPercentage = (value: number) => {
  if (Number.isNaN(value)) return '0%';
  return `${(value * 100).toFixed(0)}%`;
};

export const formatShortDateTime = (isoDate: string) => {
  try {
    const date = parseISO(isoDate);
    if (isToday(date)) {
      return format(date, "HH'h'mm", { locale: ptBR });
    }
    return format(date, "dd/MM HH'h'mm", { locale: ptBR });
  } catch {
    return isoDate;
  }
};

export const formatDayAndTime = (isoDate: string) => {
  try {
    const date = parseISO(isoDate);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return isoDate;
  }
};

export const formatRelativeDate = (isoDate: string) => {
  try {
    const date = parseISO(isoDate);
    return formatRelative(date, new Date(), { locale: ptBR });
  } catch {
    return isoDate;
  }
};
