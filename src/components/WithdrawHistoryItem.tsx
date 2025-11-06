import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { usePreferences } from '@/context/PreferencesContext';
import { WithdrawHistoryItem } from '@/types/api';
import { formatCurrencyBRL, formatDayAndTime } from '@/utils/format';

type WithdrawHistoryItemProps = {
  item: WithdrawHistoryItem;
};

const WithdrawHistoryListItem: React.FC<WithdrawHistoryItemProps> = ({ item }) => {
  const { theme } = usePreferences();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Ionicons name="swap-vertical-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.details}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{formatCurrencyBRL(item.amount)}</Text>
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>
            {formatDayAndTime(item.createdAt)}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {item.description ? (
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{item.description}</Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 18,
    gap: 12
  },
  row: {
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
  details: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  caption: {
    fontSize: 12,
    fontWeight: '500'
  },
  description: {
    fontSize: 13,
    lineHeight: 18
  }
});

export default WithdrawHistoryListItem;
