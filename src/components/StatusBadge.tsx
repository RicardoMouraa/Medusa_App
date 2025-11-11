import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

type StatusBadgeProps = {
  status: string;
  label?: string;
  style?: ViewStyle;
};

const statusPalette = {
  paid: { background: '#E5F5EC', text: '#1B873F' },
  authorized: { background: '#E5F5EC', text: '#1B873F' },
  waiting_payment: { background: '#FFF5E6', text: '#F57C00' },
  aguardando_pagamento: { background: '#FFF5E6', text: '#F57C00' },
  processing: { background: '#E8F0FE', text: '#1E88E5' },
  pending: { background: '#E8F0FE', text: '#1E88E5' },
  in_transit: { background: '#E8F0FE', text: '#1976D2' },
  aguardando_envio: { background: '#FFF5E6', text: '#F57C00' },
  delivered: { background: '#E5F5EC', text: '#1B873F' },
  canceled: { background: '#FDE8E8', text: '#E53935' },
  failed: { background: '#FDE8E8', text: '#E53935' },
  refunded: { background: '#FDE8E8', text: '#B71C1C' }
} as const;

const statusLabels: Record<string, string> = {
  waiting_payment: 'Aguardando pagamento',
  aguardando_pagamento: 'Aguardando pagamento',
  aguardando_envio: 'Aguardando envio',
  in_transit: 'Em transito',
  delivered: 'Entregue',
  paid: 'Pago',
  processing: 'Processando',
  pending: 'Em analise',
  canceled: 'Cancelado',
  failed: 'Falhou',
  refunded: 'Estornado'
};

const normalizeKey = (value: string) => value.toLowerCase().replace(/\s+/g, '_');

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, style }) => {
  const { theme } = usePreferences();
  const key = normalizeKey(status) as keyof typeof statusPalette;
  const palette = statusPalette[key] ?? {
    background: `${theme.colors.primary}1A`,
    text: theme.colors.primary
  };
  const finalLabel = label ?? statusLabels[key] ?? status;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.background,
          borderColor: `${palette.text}33`
        },
        style
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{finalLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'none'
  }
});

export default StatusBadge;
