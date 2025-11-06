import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { usePreferences } from '@/context/PreferencesContext';
import { OrderSummary } from '@/types/api';
import { formatCurrencyBRL, formatShortDateTime } from '@/utils/format';

type OrderListItemProps = {
  order: OrderSummary;
  onPress?: (order: OrderSummary) => void;
};

const OrderListItem: React.FC<OrderListItemProps> = ({ order, onPress }) => {
  const { theme } = usePreferences();

  return (
    <TouchableOpacity onPress={() => onPress?.(order)} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconWrapper}>
              <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {order.customerName ?? order.code}
              </Text>
              <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
                {formatShortDateTime(order.createdAt)}
              </Text>
            </View>
          </View>
          <StatusBadge status={order.status} label={order.statusLabel} />
        </View>
        <View style={styles.footer}>
          <View>
            <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>Valor</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatCurrencyBRL(order.amount)}
            </Text>
          </View>
          {order.paymentMethod ? (
            <View style={styles.methodPill}>
              <Text style={[styles.methodText, { color: theme.colors.textMuted }]}>
                {order.paymentMethod}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 18,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 168, 82, 0.08)'
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  caption: {
    fontSize: 12,
    fontWeight: '500'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  value: {
    fontSize: 18,
    fontWeight: '700'
  },
  methodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(12, 13, 16, 0.08)'
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase'
  }
});

export default OrderListItem;
