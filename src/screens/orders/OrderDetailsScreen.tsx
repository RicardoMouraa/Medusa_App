import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Card from '@/components/Card';
import SectionTitle from '@/components/SectionTitle';
import StatusBadge from '@/components/StatusBadge';
import { usePreferences } from '@/context/PreferencesContext';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useToast } from '@/hooks/useToast';
import { getTransactionById } from '@/services/medusaApi';
import { OrderDetail } from '@/types/api';
import { formatCurrencyBRL, formatDayAndTime } from '@/utils/format';
import { calculateNetAmount, RESERVE_PERCENTAGE } from '@/utils/finance';
import { useDashboard } from '@/hooks/useDashboard';

const RESERVE_LABEL = `Reserva financeira (${(RESERVE_PERCENTAGE * 100).toFixed(2)}%)`;
const INTERMEDIATION_LABEL = 'Taxa de intermediação (5,99% + R$ 3,99)';
const NET_AFTER_INTERMEDIATION_LABEL = 'Valor líquido após taxa';
const NET_LABEL = 'Disponível estimado (após reserva)';

type OrderDetailsScreenProps = {
  route: {
    params: {
      orderId: string;
    };
  };
  navigation: any;
};

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ route, navigation }) => {
  const { theme } = usePreferences();
  const { definition, secretKey, apiOptions } = useDashboard();
  const { showToast } = useToast();
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();

  const { data, isLoading, error, refetch } = useApiRequest<OrderDetail>(
    () =>
      secretKey
        ? getTransactionById(secretKey, orderId, apiOptions)
        : Promise.reject(
            new Error(`Informe ${definition.passkeyLabel} para abrir pedidos no ${definition.shortLabel}.`)
          ),
    [apiOptions, definition.passkeyLabel, definition.shortLabel, orderId, secretKey]
  );

  const feeSummary = useMemo(() => (data ? calculateNetAmount(data.amount) : null), [data?.amount]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (!error) return;
    showToast({
      type: 'error',
      text1: 'Erro ao carregar pedido',
      text2: error.message
    });
  }, [error, showToast]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Detalhe do pedido</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading && !data ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, color: theme.colors.textMuted }}>Carregando...</Text>
        </View>
      ) : null}

      {data ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.card}>
            <SectionTitle title={`Pedido ${data.code}`} caption={`Criado em ${formatDayAndTime(data.createdAt)}`} />
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Status</Text>
              <StatusBadge status={data.status} label={data.statusLabel} />
            </View>

            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Valor</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{formatCurrencyBRL(data.amount)}</Text>
            </View>

            {data.paymentMethod ? (
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Método</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{data.paymentMethod}</Text>
              </View>
            ) : null}
          </Card>

          {feeSummary ? (
            <Card style={styles.card}>
              <SectionTitle
                title="Taxas"
                caption="Aplicamos 5,99% + R$ 3,99 de intermediação e reserva financeira de 6,99%"
              />
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.colors.textSecondary }]}>Valor bruto</Text>
                <Text style={[styles.feeValue, { color: theme.colors.text }]}>{formatCurrencyBRL(data.amount)}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.colors.textSecondary }]}>{INTERMEDIATION_LABEL}</Text>
                <Text style={[styles.feeValue, { color: theme.colors.text }]}>
                  {formatCurrencyBRL(feeSummary.intermediationFee)}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.colors.textSecondary }]}>
                  {NET_AFTER_INTERMEDIATION_LABEL}
                </Text>
                <Text style={[styles.feeValue, { color: theme.colors.text }]}>
                  {formatCurrencyBRL(feeSummary.netBeforeReserve)}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.colors.textSecondary }]}>{RESERVE_LABEL}</Text>
                <Text style={[styles.feeValue, { color: theme.colors.text }]}>
                  {formatCurrencyBRL(feeSummary.reserveHold)}
                </Text>
              </View>
              <View style={[styles.feeRow, styles.feeHighlight]}>
                <Text style={[styles.feeLabel, { color: theme.colors.text }]}>{NET_LABEL}</Text>
                <Text style={[styles.feeValue, { color: theme.colors.text }]}>{formatCurrencyBRL(feeSummary.net)}</Text>
              </View>
            </Card>
          ) : null}

          {data.customerName || data.customerEmail ? (
            <Card style={styles.card}>
              <SectionTitle title="Cliente" />
              {data.customerName ? (
                <Text style={[styles.text, { color: theme.colors.text }]}>{data.customerName}</Text>
              ) : null}
              {data.customerEmail ? (
                <Text style={[styles.textMuted, { color: theme.colors.textSecondary }]}>
                  {data.customerEmail}
                </Text>
              ) : null}
              {data.customerPhone ? (
                <Text style={[styles.textMuted, { color: theme.colors.textSecondary }]}>
                  {data.customerPhone}
                </Text>
              ) : null}
            </Card>
          ) : null}

          {data.items?.length ? (
            <Card style={styles.card}>
              <SectionTitle title="Itens" />
              {data.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View>
                    <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.textMuted, { color: theme.colors.textSecondary }]}>
                      {item.quantity} un • {formatCurrencyBRL(item.unitPrice)}
                    </Text>
                  </View>
                  <Text style={[styles.itemTotal, { color: theme.colors.text }]}>
                    {formatCurrencyBRL(item.unitPrice * item.quantity)}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}

          {data.timeline?.length ? (
            <Card style={styles.card}>
              <SectionTitle title="Linha do tempo" />
              {data.timeline.map((event) => (
                <View key={`${event.status}-${event.createdAt}`} style={styles.timelineItem}>
                  <View style={styles.timelineIndicator} />
                  <View style={styles.timelineContent}>
                    <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{event.label}</Text>
                    <Text style={[styles.textMuted, { color: theme.colors.textSecondary }]}>
                      {formatDayAndTime(event.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 120
  },
  card: {
    padding: 20,
    gap: 16
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 14,
    fontWeight: '600'
  },
  value: {
    fontSize: 16,
    fontWeight: '700'
  },
  text: {
    fontSize: 16,
    fontWeight: '600'
  },
  textMuted: {
    fontSize: 13,
    marginTop: 4
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)'
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600'
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700'
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10
  },
  timelineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#06A852',
    marginTop: 6
  },
  timelineContent: {
    flex: 1
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  feeLabel: {
    fontSize: 13,
    fontWeight: '500'
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '700'
  },
  feeHighlight: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)'
  }
});

export default OrderDetailsScreen;
