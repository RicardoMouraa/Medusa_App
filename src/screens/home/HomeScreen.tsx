import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import BalanceSummaryCard from '@/components/BalanceSummaryCard';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import MedusaHeader from '@/components/MedusaHeader';
import PeriodSelector from '@/components/PeriodFilter';
import PrimaryButton from '@/components/PrimaryButton';
import SectionTitle from '@/components/SectionTitle';
import StatCard from '@/components/StatCard';
import { usePreferences } from '@/context/PreferencesContext';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useToast } from '@/hooks/useToast';
import { getDashboard } from '@/services/api';
import { DashboardSummary, PeriodFilter as PeriodFilterValue } from '@/types/api';
import { formatCurrencyBRL, formatPercentage } from '@/utils/format';

const HomeScreen: React.FC = ({ navigation }: any) => {
  const { theme } = usePreferences();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<PeriodFilterValue>('today');

  const {
    data,
    isLoading,
    error,
    refetch
  } = useApiRequest<DashboardSummary>(() => getDashboard(period), [period]);

  const handleFinanceShortcut = useCallback(() => {
    navigation.navigate('FinanceTab');
  }, [navigation]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const salesDistribution = useMemo(() => {
    if (!data) {
      return [];
    }
    const totals = data.salesByMethod ?? {};
    const sum = Object.values(totals).reduce((acc, value) => acc + value, 0);
    if (sum === 0) return [];
    return Object.entries(totals).map(([method, value]) => ({
      method,
      value,
      percentage: value / sum
    }));
  }, [data]);

  useEffect(() => {
    if (!error) return;
    showToast({
      type: 'error',
      text1: 'Não foi possível carregar o dashboard',
      text2: error.message
    });
  }, [error, showToast]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MedusaHeader
        actions={[
          {
            icon: 'notifications-outline',
            onPress: () => showToast({ type: 'info', text1: 'Central de notificações em breve' })
          }
        ]}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRetry} tintColor={theme.colors.primary} />
        }
      >
        {data ? (
          <>
            <BalanceSummaryCard
              available={data.availableBalance}
              pending={data.pendingBalance}
              currency={data.currency}
              onWithdrawPress={handleFinanceShortcut}
            />

            <View style={styles.section}>
              <SectionTitle title="Período" caption="Filtre seus indicadores" />
              <PeriodSelector value={period} onChange={setPeriod} />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                label="Total de vendas pagas"
                value={formatCurrencyBRL(data.totalPaidAmount)}
                icon="cash-outline"
              />
              <StatCard
                label="Pedidos pagos"
                value={data.paidOrdersCount?.toString() ?? '0'}
                icon="cart-outline"
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Ticket médio"
                value={formatCurrencyBRL(data.averageTicket)}
                icon="trending-up-outline"
              />
              <StatCard
                label="Saldo pendente"
                value={formatCurrencyBRL(data.pendingBalance)}
                icon="time-outline"
              />
            </View>

            <View style={styles.section}>
              <SectionTitle title="Vendas por método" caption="Distribuição percentual" />
              <Card>
                {salesDistribution.length === 0 ? (
                  <EmptyState
                    title="Ainda sem vendas"
                    subtitle="Assim que suas vendas forem confirmadas aparecerão aqui por método."
                    icon="pie-chart-outline"
                  />
                ) : (
                  salesDistribution.map((item) => (
                    <View key={item.method} style={styles.methodRow}>
                      <View style={styles.methodHeader}>
                        <Text style={[styles.methodLabel, { color: theme.colors.text }]}>
                          {item.method.replace('_', ' ')}
                        </Text>
                        <Text style={[styles.methodValue, { color: theme.colors.text }]}>
                          {formatPercentage(item.percentage)}
                        </Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
                        <View
                          style={[
                            styles.progressIndicator,
                            {
                              width: `${item.percentage * 100}%`,
                              backgroundColor: theme.colors.primary
                            }
                          ]}
                        />
                      </View>
                    </View>
                  ))
                )}
              </Card>
            </View>
          </>
        ) : isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
              Carregando dashboard...
            </Text>
          </View>
        ) : (
          <EmptyState />
        )}

        <View style={styles.section}>
          <PrimaryButton label="Atualizar dados" onPress={handleRetry} variant="outline" />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  flex: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 100
  },
  section: {
    gap: 16
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16
  },
  methodRow: {
    marginBottom: 16
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  methodValue: {
    fontSize: 15,
    fontWeight: '700'
  },
  progressTrack: {
    height: 10,
    borderRadius: 12,
    overflow: 'hidden'
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 12
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 14
  }
});

export default HomeScreen;
