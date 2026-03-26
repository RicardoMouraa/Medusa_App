import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Card from '@/components/Card';
import MedusaHeader from '@/components/MedusaHeader';
import PrimaryButton from '@/components/PrimaryButton';
import SectionTitle from '@/components/SectionTitle';
import TextField from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useToast } from '@/hooks/useToast';
import { useDashboard } from '@/hooks/useDashboard';
import { createTransfer, getBalance } from '@/services/medusaApi';
import { sendLocalNotification } from '@/services/notifications';
import { ApiError, BalanceResponse } from '@/types/api';
import { formatCurrencyBRL } from '@/utils/format';
import { maskCurrency, parseCurrencyToNumber } from '@/utils/validation';

const PIX_KEY_TYPES = [
  'CPF',
  'CNPJ',
  'E-mail',
  'Telefone',
  'Chave aleatoria',
  'QR Code (copia e cola)'
] as const;

const PIX_KEY_TYPE_MAP: Record<(typeof PIX_KEY_TYPES)[number], string> = {
  CPF: 'cpf',
  CNPJ: 'cnpj',
  'E-mail': 'email',
  Telefone: 'phone',
  'Chave aleatoria': 'evp',
  'QR Code (copia e cola)': 'copypaste'
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
        ? getBalance(secretKey, { recipientId }, apiOptions)
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
  } = useApiRequest<BalanceResponse>(fetchFinanceData, [fetchFinanceData]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const withdrawFee =
    financeData?.withdrawFee && financeData.withdrawFee > 0 ? financeData.withdrawFee : 10;
  const available = financeData?.available ?? 0;
  const pending = financeData?.pending ?? 0;
  const minimumWithdrawRequired = useMemo(
    () => Math.max(withdrawFee, financeData?.minimumWithdraw ?? 0),
    [financeData?.minimumWithdraw, withdrawFee]
  );

  const handleAmountChange = useCallback((value: string) => {
    setWithdrawValue(maskCurrency(value));
  }, []);

  const validate = useCallback(() => {
    const amount = parseCurrencyToNumber(withdrawValue);
    const trimmedPixKey = pixKey.trim();

    if (!trimmedPixKey) {
      showToast({
        type: 'error',
        text1: 'Informe a chave Pix',
        text2: 'Para solicitar o saque precisamos da chave de destino.'
      });
      return false;
    }

    if (amount <= 0) {
      showToast({
        type: 'error',
        text1: 'Valor invalido',
        text2: 'Digite um valor maior que zero.'
      });
      return false;
    }

    if (amount <= withdrawFee) {
      showToast({
        type: 'error',
        text1: 'Valor abaixo da taxa de saque',
        text2: `Solicite um valor superior a ${formatCurrencyBRL(withdrawFee)}.`
      });
      return false;
    }

    if (minimumWithdrawRequired > 0 && amount < minimumWithdrawRequired) {
      showToast({
        type: 'error',
        text1: 'Valor abaixo do minimo permitido',
        text2: `O valor minimo para saque e ${formatCurrencyBRL(minimumWithdrawRequired)}.`
      });
      return false;
    }

    if (amount > available) {
      showToast({
        type: 'error',
        text1: 'Saldo insuficiente',
        text2: 'O valor solicitado e maior que o saldo disponivel para saque.'
      });
      return false;
    }

    return true;
  }, [available, minimumWithdrawRequired, pixKey, showToast, withdrawFee, withdrawValue]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      if (!secretKey) {
        throw new Error(`Informe ${definition.passkeyLabel} para solicitar saques no ${displayLabel}.`);
      }

      const amount = parseCurrencyToNumber(withdrawValue);
      const amountInCents = Math.round(amount * 100);

      await createTransfer(
        secretKey,
        {
          method: 'fiat',
          amount: amountInCents,
          pixKey: pixKey.trim(),
          pixKeyType: PIX_KEY_TYPE_MAP[selectedType],
          netPayout: false
        },
        apiOptions
      );

      showToast({
        type: 'success',
        text1: 'Saque solicitado com sucesso',
        text2: 'Acompanhe o status na aba de historico de saques.'
      });

      try {
        await sendLocalNotification('withdraw', { amount });
      } catch (notificationError) {
        console.warn('[Finance] Failed to send local withdraw notification', notificationError);
      }

      setPixKey('');
      setWithdrawValue('');
      await refetch();
    } catch (err) {
      const apiError = err as ApiError;
      const rawMessage = apiError?.message ?? 'Nao foi possivel solicitar o saque.';
      const helpMessage = rawMessage.toLowerCase().includes('withdraw')
        ? `${rawMessage} Verifique no painel da Medusa se a funcionalidade de saque via API esta habilitada para a sua conta.`
        : rawMessage;

      showToast({
        type: 'error',
        text1: 'Erro ao solicitar saque',
        text2: helpMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    apiOptions,
    definition.passkeyLabel,
    displayLabel,
    pixKey,
    refetch,
    secretKey,
    selectedType,
    validate,
    withdrawValue,
    showToast
  ]);

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
          <Text style={[styles.balanceLabel, { color: theme.colors.textMuted }]}>Saldo disponivel</Text>
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

          <View
            style={[
              styles.infoBox,
              { backgroundColor: theme.isDark ? `${theme.colors.primary}24` : 'rgba(6, 168, 82, 0.12)' }
            ]}
          >
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Taxa de saque: {formatCurrencyBRL(withdrawFee)}
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Por politica operacional, somente valores superiores a taxa de saque podem ser solicitados.
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
            Ver historico de saques
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
