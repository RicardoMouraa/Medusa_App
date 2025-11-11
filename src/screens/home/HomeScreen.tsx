import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import BalanceSummaryCard from '@/components/BalanceSummaryCard';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import MedusaHeader from '@/components/MedusaHeader';
import PeriodSelector from '@/components/PeriodFilter';
import PrimaryButton from '@/components/PrimaryButton';
import SectionTitle from '@/components/SectionTitle';
import StatCard from '@/components/StatCard';
import SalesChartCard from '@/components/SalesChartCard';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useToast } from '@/hooks/useToast';
import { getBalance, getTransactions } from '@/services/medusaApi';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardSummary, OrderSummary, PeriodFilter as PeriodFilterValue } from '@/types/api';
import { formatCurrencyBRL, formatPercentage } from '@/utils/format';
import { sumPaidNetAmount } from '@/utils/finance';
import { format, subDays, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type MethodMeta = {
  label: string;
  icon: string;
  iconSet?: 'ion' | 'materialCommunity' | 'materialIcons';
};

const METHOD_LABELS: Record<string, MethodMeta> = {
  creditCard: { label: 'Cartão de Crédito', icon: 'card-outline', iconSet: 'ion' },
  pix: { label: 'Pix', icon: 'pix', iconSet: 'materialIcons' },
  boleto: { label: 'Boleto', icon: 'document-text-outline', iconSet: 'ion' }
};

const getMethodMeta = (method: string): MethodMeta =>
  METHOD_LABELS[method] ?? { label: method, icon: 'stats-chart-outline', iconSet: 'ion' };

type SalesChartPoint = {
  label: string;
  value: number;
};

const renderMethodIcon = (meta: MethodMeta, color: string) => {
  if (meta.iconSet === 'materialIcons') {
    return (
      <MaterialIcons
        name={meta.icon as keyof typeof MaterialIcons.glyphMap}
        size={20}
        color={color}
      />
    );
  }
  if (meta.iconSet === 'materialCommunity') {
    return (
      <MaterialCommunityIcons
        name={meta.icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={20}
        color={color}
      />
    );
  }
  return (
    <Ionicons
      name={meta.icon as keyof typeof Ionicons.glyphMap}
      size={18}
      color={color}
    />
  );
};

const PERIOD_TO_DAYS: Record<Exclude<PeriodFilterValue, 'custom'>, number | 'today'> = {
  today: 'today',
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365
};

const resolveRange = (
  period: PeriodFilterValue,
  customRange: { start: Date; end: Date } | null
): { start: Date; end: Date } | null => {
  if (period === 'custom') {
    return customRange;
  }

  const value = PERIOD_TO_DAYS[period as Exclude<PeriodFilterValue, 'custom'>];
  const end = new Date();
  const start = new Date();
  if (value === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  start.setDate(start.getDate() - (value ?? 0));
  return { start, end };
};

const normalizeMethodKey = (method?: string) => {
  if (!method) return 'outros';
  const normalized = method.toLowerCase();
  if (normalized.includes('credit')) return 'creditCard';
  if (normalized.includes('boleto')) return 'boleto';
  if (normalized.includes('pix')) return 'pix';
  return normalized.replace(/\s+/g, '');
};

const isWithinRange = (dateValue: string | undefined, range: { start: Date; end: Date } | null) => {
  if (!range || !dateValue) return true;
  const date = new Date(dateValue);
  return date >= range.start && date <= range.end;
};

const buildDailySales = (transactions: OrderSummary[], days = 6): SalesChartPoint[] => {
  const today = new Date();
  const totals = transactions.reduce<Record<string, number>>((acc, transaction) => {
    const key = format(new Date(transaction.createdAt), 'yyyy-MM-dd');
    acc[key] = (acc[key] ?? 0) + transaction.amount;
    return acc;
  }, {});

  const points: SalesChartPoint[] = [];
  for (let i = days; i >= 0; i--) {
    const day = subDays(today, i);
    const key = format(day, 'yyyy-MM-dd');
    points.push({
      label: format(day, 'dd MMM', { locale: ptBR }),
      value: totals[key] ?? 0
    });
  }

  return points;
};

type DashboardData = DashboardSummary & {
  dailySales: SalesChartPoint[];
};

const HomeScreen: React.FC = ({ navigation }: any) => {
  const { theme } = usePreferences();
  const { profile } = useAuth();
  const { definition, secretKey, apiOptions } = useDashboard();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<PeriodFilterValue>('today');
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);

  const recipientId = profile?.recipientId ?? undefined;

  const fetchDashboard = useCallback(async () => {
    if (!secretKey) {
      throw new Error(`Informe ${definition.passkeyLabel} para acessar o ${definition.shortLabel}.`);
    }
    const [balance, transactions] = await Promise.all([
      getBalance(secretKey, { recipientId }, apiOptions),
      getTransactions(secretKey, { count: 100 }, apiOptions)
    ]);

    const range = resolveRange(period, customRange);
    const paidTransactions = transactions.filter((transaction) => transaction.status === 'paid');
    const availableFromTransactions = sumPaidNetAmount(paidTransactions);
    const filtered = paidTransactions.filter((transaction) => isWithinRange(transaction.createdAt, range));
    const daysSpan = range ? Math.max(0, differenceInCalendarDays(range.end, range.start)) : 6;
    const dailySales = buildDailySales(filtered, daysSpan);

    const totalPaidAmount = filtered.reduce((sum, transaction) => sum + transaction.amount, 0);
    const paidOrdersCount = filtered.length;
    const averageTicket = paidOrdersCount ? totalPaidAmount / paidOrdersCount : 0;
    const salesByMethod = filtered.reduce<DashboardSummary['salesByMethod']>(
      (acc, transaction) => {
        const key = normalizeMethodKey(transaction.paymentMethod);
        acc[key] = (acc[key] ?? 0) + transaction.amount;
        return acc;
      },
      { creditCard: 0, pix: 0, boleto: 0 }
    );

    return {
      currency: balance.currency,
      availableBalance: availableFromTransactions,
      pendingBalance: balance.pending ?? 0,
      totalPaidAmount,
      paidOrdersCount,
      averageTicket,
      salesByMethod,
      dailySales
    } satisfies DashboardData;
  }, [apiOptions, customRange, definition.passkeyLabel, definition.shortLabel, period, recipientId, secretKey]);

  const { data, isLoading, error, refetch } = useApiRequest<DashboardData>(fetchDashboard, [fetchDashboard]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const handleFinanceShortcut = useCallback(() => {
    navigation.navigate('FinanceTab');
  }, [navigation]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const salesDistribution = useMemo(() => {
    if (!data) return [];
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
      <MedusaHeader title="Dashboard" subtitle={definition.shortLabel} />

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
              <PeriodSelector
                value={period}
                onChange={setPeriod}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
              />
              <Text style={[styles.scrollHint, { color: theme.colors.textSecondary }]}>
                Deslize para ver mais opções →
              </Text>
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
              <SalesChartCard data={data.dailySales ?? []} currency={data.currency} />
            </View>

            <View style={styles.section}>
              <Card>
                <SectionTitle
                  title="Vendas por método"
                  caption="Distribuição percentual"
                  titleStyle={styles.cardSectionTitle}
                />
                {salesDistribution.length === 0 ? (
                  <EmptyState
                    title="Ainda sem vendas"
                    subtitle="Assim que suas vendas forem confirmadas aparecerão aqui por método."
                    icon="pie-chart-outline"
                  />
                ) : (
                  salesDistribution.map((item) => {
                    const meta = getMethodMeta(item.method);
                    return (
                      <View key={item.method} style={styles.methodRow}>
                        <View style={styles.methodHeader}>
                          <View style={styles.methodInfo}>
                            {renderMethodIcon(meta, theme.colors.primary)}
                            <Text style={[styles.methodLabel, { color: theme.colors.text }]}>{meta.label}</Text>
                          </View>
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
                    );
                  })
                )}
              </Card>
            </View>
          </>
        ) : isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Carregando dashboard...</Text>
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
  cardSectionTitle: {
    fontSize: 16
  },
  scrollHint: {
    fontSize: 12,
    fontWeight: '600'
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
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600'
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

