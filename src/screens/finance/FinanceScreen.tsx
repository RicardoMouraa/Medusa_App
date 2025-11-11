import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import Card from '@/components/Card';
import MedusaHeader from '@/components/MedusaHeader';
import PrimaryButton from '@/components/PrimaryButton';
import SectionTitle from '@/components/SectionTitle';
import TextField from '@/components/TextField';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useToast } from '@/hooks/useToast';
import { getBalance, createTransfer, getTransactions } from '@/services/medusaApi';
import { useDashboard } from '@/hooks/useDashboard';
import { ApiError, BalanceResponse, OrderSummary, WithdrawRequestPayload } from '@/types/api';
import { formatCurrencyBRL } from '@/utils/format';
import { maskCurrency, parseCurrencyToNumber } from '@/utils/validation';
import { RESERVE_PERCENTAGE, sumNetBreakdown } from '@/utils/finance';

const PIX_KEY_TYPES = [
  'CPF',
  'CNPJ',
  'E-mail',
  'Telefone',
  'Chave aleatória',
  'QR Code (copia e cola)'
] as const;

type FinanceData = {
  balance: BalanceResponse;
  transactions: OrderSummary[];
};

const FinanceScreen: React.FC = ({ navigation }: any) => {
  const { theme } = usePreferences();
  const { profile } = useAuth();
  const { definition, secretKey, apiOptions, displayLabel } = useDashboard();
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<(typeof PIX_KEY_TYPES)[number]>('CPF');
  const [pixKey, setPixKey] = useState('');
  const [withdrawValue, setWithdrawValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipientId = profile?.recipientId ?? undefined;

  const fetchFinanceData = useCallback(
    () =>
      secretKey
        ? Promise.all([
            getBalance(secretKey, { recipientId }, apiOptions),
            getTransactions(secretKey, { count: 100 }, apiOptions)
          ]).then(([balance, transactions]) => ({ balance, transactions }))
        : Promise.reject(
            new Error(`Informe ${definition.passkeyLabel} para acessar o ${displayLabel}.`)
          ),
    [apiOptions, definition.passkeyLabel, displayLabel, recipientId, secretKey]
  );

  const {
    data: financeData,
    isLoading,
    error,
    refetch
  } = useApiRequest<FinanceData>(fetchFinanceData, [fetchFinanceData]);

  const netBreakdown = useMemo(
    () => (financeData ? sumNetBreakdown(financeData.transactions) : null),
    [financeData?.transactions]
  );

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const withdrawFee =
    financeData?.balance.withdrawFee && financeData.balance.withdrawFee > 0 ? financeData.balance.withdrawFee : 10;
  const available = netBreakdown?.net ?? 0;
  const netBeforeReserveTotal = netBreakdown?.netBeforeReserve ?? 0;
  const reserveHoldTotal = netBreakdown?.reserveHold ?? 0;
  const pending = financeData?.balance.pending ?? 0;

  const handleAmountChange = useCallback((value: string) => {
    setWithdrawValue(maskCurrency(value));
  }, []);

  const validate = useCallback(() => {
    const amount = parseCurrencyToNumber(withdrawValue);
    if (!pixKey) {
      showToast({
        type: 'error',
        text1: 'Informe a chave Pix',
        text2: 'Para sacar precisamos da chave cadastrada.'
      });
      return false;
    }
    if (amount <= 0) {
      showToast({
        type: 'error',
        text1: 'Valor inválido',
        text2: 'Digite um valor maior que zero.'
      });
      return false;
    }
    if (amount > available) {
      showToast({
        type: 'error',
        text1: 'Saldo insuficiente',
        text2: 'O valor solicitado é maior que o saldo disponível.'
      });
      return false;
    }
    if (financeData?.balance.minimumWithdraw && amount < financeData.balance.minimumWithdraw) {
      showToast({
        type: 'error',
        text1: 'Valor abaixo do mínimo',
        text2: `O saque mínimo é de ${formatCurrencyBRL(financeData.balance.minimumWithdraw)}.`
      });
      return false;
    }
    return true;
  }, [available, financeData?.balance.minimumWithdraw, pixKey, showToast, withdrawValue]);

  const payload = useMemo<WithdrawRequestPayload>(() => {
    const amount = parseCurrencyToNumber(withdrawValue);
    return {
      pixKeyType: selectedType,
      pixKey,
      amount
    };
  }, [pixKey, selectedType, withdrawValue]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      if (!secretKey) {
        throw new Error(`Informe ${definition.passkeyLabel} para solicitar saques no ${displayLabel}.`);
      }

      const amountInCents = Math.round(payload.amount * 100);

      await createTransfer(
        secretKey,
        {
          amount: amountInCents,
          pixKey: payload.pixKey,
          pixKeyType: payload.pixKeyType,
          recipientId: recipientId ? Number(recipientId) : undefined
        },
        apiOptions
      );
      showToast({
        type: 'success',
        text1: 'Transferencia criada',
        text2: 'Acompanhe o status na aba de historico.'
      });

      setPixKey('');
      setWithdrawValue('');
      await refetch();
    } catch (err) {
      const apiError = err as ApiError;

      showToast({
        type: 'error',
        text1: 'Erro ao solicitar saque',
        text2: apiError.message
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [apiOptions, definition.passkeyLabel, displayLabel, payload, recipientId, refetch, secretKey, showToast, validate]);



  const handleHistoryPress = useCallback(() => {
    navigation.navigate('WithdrawHistory');
  }, [navigation]);

  useEffect(() => {
    if (!error) return;
    showToast({
      type: 'error',
      text1: 'Erro ao carregar saldo',
      text2: error.message
    });
  }, [error, showToast]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MedusaHeader
        title="Financeiro"
        subtitle={displayLabel}
        actions={[
          {
            icon: 'refresh',
            onPress: () => void refetch()
          }
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, { color: theme.colors.textMuted }]}>Saldo disponível</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.balanceValue, { color: theme.colors.text }]}>
              {formatCurrencyBRL(available)}
            </Text>
          )}
          <Text style={[styles.balanceCaption, { color: theme.colors.textSecondary }]}>
            Saldo pendente {formatCurrencyBRL(pending)}
          </Text>
        </Card>

        <Card style={styles.formCard}>
          <SectionTitle title="Solicitar saque via Pix" />

          <View style={styles.pillGroup}>
            {PIX_KEY_TYPES.map((type) => {
              const isActive = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceAlt,
                      borderColor: isActive ? theme.colors.primary : theme.colors.border
                    }
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.pillLabel,
                      {
                        color: isActive ? theme.colors.headerTint : theme.colors.textSecondary
                      }
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextField
            label="Chave Pix"
            placeholder="Insira sua chave Pix"
            value={pixKey}
            onChangeText={setPixKey}
          />
          <TextField
            label="Valor do saque"
            keyboardType="numeric"
            value={withdrawValue}
            placeholder="R$ 0,00"
            onChangeText={handleAmountChange}
          />

          <View style={styles.infoBox}>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Valor líquido após taxa de intermediação {formatCurrencyBRL(netBeforeReserveTotal)}
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Reserva financeira ({(RESERVE_PERCENTAGE * 100).toFixed(2)}%) retida {formatCurrencyBRL(reserveHoldTotal)}
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Saldo disponível (após reserva) {formatCurrencyBRL(available)}
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Taxa de saque {formatCurrencyBRL(withdrawFee)}
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Saldo líquido após taxa de saque {formatCurrencyBRL(Math.max(0, available - withdrawFee))}
            </Text>
          </View>

            <PrimaryButton
              label="Solicitar saque"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
        </Card>

        <TouchableOpacity style={styles.historyLink} onPress={handleHistoryPress}>
          <Text style={[styles.historyText, { color: theme.colors.primary }]}>
            Ver histórico de saques
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 24,
    paddingBottom: 120
  },
  balanceCard: {
    gap: 6,
    padding: 20
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600'
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8
  },
  balanceCaption: {
    fontSize: 13,
    marginTop: 4
  },
  formCard: {
    gap: 20,
    padding: 20
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  infoBox: {
    backgroundColor: 'rgba(6, 168, 82, 0.08)',
    padding: 14,
    borderRadius: 16,
    gap: 6
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500'
  },
  historyLink: {
    alignItems: 'center'
  },
  historyText: {
    fontSize: 15,
    fontWeight: '600'
  }
});

export default FinanceScreen;
