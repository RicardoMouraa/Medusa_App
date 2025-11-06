import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { usePreferences } from '@/context/PreferencesContext';
import { formatCurrencyBRL } from '@/utils/format';

type BalanceSummaryCardProps = {
  available: number;
  pending: number;
  currency?: string;
  onWithdrawPress?: () => void;
};

const BalanceSummaryCard: React.FC<BalanceSummaryCardProps> = ({
  available,
  pending,
  currency = 'BRL',
  onWithdrawPress
}) => {
  const { theme } = usePreferences();

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Saldo disponível</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{formatCurrencyBRL(available)}</Text>
      </View>
      <View style={styles.row}>
        <View>
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>Saldo pendente</Text>
          <Text style={[styles.pending, { color: theme.colors.text }]}>{formatCurrencyBRL(pending)}</Text>
        </View>
        <PrimaryButton label="Sacar agora" onPress={onWithdrawPress} style={styles.button} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20
  },
  header: {
    gap: 6
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  caption: {
    fontSize: 13,
    fontWeight: '500'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  pending: {
    fontSize: 18,
    fontWeight: '700'
  },
  button: {
    width: 150
  }
});

export default BalanceSummaryCard;
