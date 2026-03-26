import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/Card';
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
  onWithdrawPress
}) => {
  const { theme } = usePreferences();

  const cardBackgroundColor = theme.isDark ? theme.colors.card : '#D8F6D0';
  const subtitleColor = theme.isDark ? theme.colors.textMuted : '#06421B';
  const valueColor = theme.isDark ? theme.colors.text : '#032B0B';
  const captionColor = theme.isDark ? theme.colors.textSecondary : '#06421B';
  const pendingColor = theme.isDark ? theme.colors.text : '#032B0B';

  return (
    <Card style={[styles.container, { backgroundColor: cardBackgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>Saldo disponivel</Text>
        <Text style={[styles.value, { color: valueColor }]}>{formatCurrencyBRL(available)}</Text>
      </View>
      <View style={styles.row}>
        <View>
          <Text style={[styles.caption, { color: captionColor }]}>Pendente</Text>
          <Text style={[styles.pending, { color: pendingColor }]}>{formatCurrencyBRL(pending)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onWithdrawPress}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonLabel, { color: theme.colors.headerTint }]}>Saque agora</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.headerTint} />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 22,
    gap: 20,
    borderRadius: 24,
    overflow: 'hidden'
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 6
  },
  buttonLabel: {
    fontWeight: '700',
    fontSize: 14
  }
});

export default BalanceSummaryCard;
