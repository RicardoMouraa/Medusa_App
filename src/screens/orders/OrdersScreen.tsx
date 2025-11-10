import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';

import EmptyState from '@/components/EmptyState';
import MedusaHeader from '@/components/MedusaHeader';
import OrderListItem from '@/components/OrderListItem';
import PeriodSelector from '@/components/PeriodFilter';
import PrimaryButton from '@/components/PrimaryButton';
import SectionTitle from '@/components/SectionTitle';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useToast } from '@/hooks/useToast';
import { getTransactions } from '@/services/medusaApi';
import { OrderSummary } from '@/types/api';

const STATUS_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Pagos', value: 'paid' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Cancelados', value: 'canceled' }
] as const;

const OrdersScreen: React.FC = ({ navigation }: any) => {
  const { theme } = usePreferences();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]['value']>('all');

  const secretKey = profile?.secretKey;

  const mapStatusFilter = useCallback(
    (value: (typeof STATUS_OPTIONS)[number]['value']) => {
      if (value === 'all') return undefined;
      if (value === 'pending') return 'waiting_payment,processing';
      if (value === 'paid') return 'paid';
      if (value === 'canceled') return 'canceled';
      return value;
    },
    []
  );

  const fetchOrders = useCallback(
    () =>
      secretKey
        ? getTransactions(secretKey, {
            status: mapStatusFilter(status)
          })
        : Promise.reject(new Error('Secret Key nao configurada.')),
    [mapStatusFilter, secretKey, status]
  );

  const { data, isLoading, error, refetch } = useApiRequest<OrderSummary[]>(fetchOrders, [fetchOrders]);

  const handleOrderPress = useCallback(
    (order: OrderSummary) => {
      navigation.navigate('OrderDetails', { orderId: order.id });
    },
    [navigation]
  );

  const statusFilterOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value as any
      })),
    []
  );

  useEffect(() => {
    if (!error) return;
    showToast({
      type: 'error',
      text1: 'Erro ao carregar pedidos',
      text2: error.message
    });
  }, [error, showToast]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MedusaHeader
        title="Pedidos"
        actions={[
          {
            icon: 'search-outline',
            onPress: () =>
              showToast({
                type: 'info',
                text1: 'Busca rápida em desenvolvimento'
              })
          }
        ]}
      />

      <View style={styles.content}>
        <SectionTitle title="Filtrar por status" />
        <PeriodSelector
          value={status as any}
          onChange={(value) => setStatus(value as (typeof STATUS_OPTIONS)[number]['value'])}
          options={statusFilterOptions as any}
        />

        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <OrderListItem order={item} onPress={handleOrderPress} />}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                  Carregando pedidos...
                </Text>
              </View>
            ) : (
              <EmptyState
                title="Nenhum pedido encontrado"
                subtitle="Ajuste os filtros ou tente novamente mais tarde."
                icon="archive-outline"
              />
            )
          }
          ListFooterComponent={
            <PrimaryButton
              label="Atualizar lista"
              variant="outline"
              onPress={() => void refetch()}
              style={styles.footerButton}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    padding: 20
  },
  listContent: {
    paddingVertical: 16
  },
  loading: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14
  },
  footerButton: {
    marginHorizontal: 16,
    marginTop: 12
  }
});

export default OrdersScreen;
