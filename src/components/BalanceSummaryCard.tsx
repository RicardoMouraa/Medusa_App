import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/Card';
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
}) => (
  <Card style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.subtitle}>Saldo disponível</Text>
      <Text style={styles.value}>{formatCurrencyBRL(available)}</Text>
    </View>
    <View style={styles.row}>
      <View>
        <Text style={styles.caption}>Pendente</Text>
        <Text style={styles.pending}>{formatCurrencyBRL(pending)}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onWithdrawPress} activeOpacity={0.85}>
        <Text style={styles.buttonLabel}>Saque agora</Text>
        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    padding: 22,
    gap: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#D8F6D0'
  },
  header: {
    gap: 6
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#032B0B'
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#032B0B'
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: '#06421B'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  pending: {
    fontSize: 18,
    fontWeight: '700',
    color: '#032B0B'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05A660',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 6
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  }
});

export default BalanceSummaryCard;
