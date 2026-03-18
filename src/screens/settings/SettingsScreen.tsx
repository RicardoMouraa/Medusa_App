import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/Card';
import SectionTitle from '@/components/SectionTitle';
import ToggleRow from '@/components/ToggleRow';
import MedusaHeader from '@/components/MedusaHeader';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { usePreferences } from '@/context/PreferencesContext';
import { useToast } from '@/hooks/useToast';
import { useDashboard, getAvailableDashboards } from '@/hooks/useDashboard';
import type { DashboardId } from '@/types/dashboard';
import { useAuth } from '@/context/AuthContext';
import { sendExpoPushTestNotificationAsync, sendLocalNotification } from '@/services/notifications';
import type { NotificationType } from '@/utils/notifications';

type LocalTestScenario = {
  type: NotificationType;
  paymentMethod: 'cartao' | 'pix' | 'boleto';
  customer: string;
};

const LOCAL_TEST_SCENARIOS: LocalTestScenario[] = [
  { type: 'sale', paymentMethod: 'cartao', customer: 'Cliente cartao' },
  { type: 'sale', paymentMethod: 'pix', customer: 'Cliente pix' },
  { type: 'sale', paymentMethod: 'boleto', customer: 'Cliente boleto' },
  { type: 'pix_generated', paymentMethod: 'pix', customer: 'Cliente pix' },
  { type: 'boleto_generated', paymentMethod: 'boleto', customer: 'Cliente boleto' }
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const SettingsScreen: React.FC = () => {
  const {
    preferences,
    theme,
    setTheme,
    toggleNotification,
    toggleNotificationModel,
    refreshFromServer,
    refreshPushToken,
    setDashboard,
    setDashboardAlias
  } = usePreferences();
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const { definition, selectedDashboardId, displayLabel } = useDashboard();
  const { showToast } = useToast();
  const dashboards = useMemo(() => getAvailableDashboards(), []);
  const dashboardAliases: Partial<Record<DashboardId, string>> = preferences.dashboardAliases ?? {};
  const activeTemplateModel = preferences.notifications.models.creative ? 'creative' : 'default';

  const randomTestAmount = useCallback(() => Number((Math.random() * 800 + 20).toFixed(2)), []);

  const handleThemeToggle = useCallback(
    (value: boolean) => {
      setTheme(value ? 'light' : 'dark');
    },
    [setTheme]
  );

  const handleNotificationModelToggle = useCallback(
    (model: 'default' | 'creative') => {
      const models = preferences.notifications.models;
      if (
        models[model] &&
        Object.entries(models).filter(([, enabled]) => enabled).length === 1
      ) {
        showToast({
          type: 'info',
          text1: 'Mantenha pelo menos um modelo ativo'
        });
        return;
      }
      toggleNotificationModel(model);
    },
    [preferences.notifications.models, showToast, toggleNotificationModel]
  );

  const handleDashboardSelect = useCallback(
    (dashboardId: DashboardId, passkeyField: 'secretKey' | 'secondarySecretKey') => {
      if (passkeyField === 'secondarySecretKey' && !profile?.secondarySecretKey) {
        showToast({
          type: 'info',
          text1: 'Configure a Passkey 2',
          text2: 'Adicione a segunda chave na tela de passkeys para liberar o Dashboard 2.'
        });
        navigation.navigate('SecretKey' as never);
        return;
      }
      setDashboard(dashboardId);
    },
    [navigation, profile?.secondarySecretKey, setDashboard, showToast]
  );

  const handleManagePasskeys = useCallback(() => {
    navigation.navigate('SecretKey' as never);
  }, [navigation]);

  const handleForceSync = useCallback(async () => {
    await refreshFromServer();
    showToast({
      type: 'success',
      text1: 'Preferências sincronizadas'
    });
  }, [refreshFromServer, showToast]);

  const handlePushRegistration = useCallback(async () => {
    const token = await refreshPushToken();
    showToast({
      type: token ? 'success' : 'info',
      text1: token ? 'Push configurado' : 'Permissao necessaria',
      text2: token
        ? 'Suas notificacoes push foram atualizadas.'
        : 'Autorize notificacoes no dispositivo e use aparelho fisico.'
    });
  }, [refreshPushToken, showToast]);

  const handlePushTest = useCallback(async () => {
    const token = preferences.expoPushToken ?? (await refreshPushToken());
    if (!token) {
      showToast({
        type: 'info',
        text1: 'Token de push indisponivel',
        text2: 'Valide as permissoes de notificacao no dispositivo.'
      });
      return;
    }

    try {
      await sendExpoPushTestNotificationAsync(token, {
        type: 'sale',
        amount: randomTestAmount(),
        templateKey: activeTemplateModel
      });
      showToast({
        type: 'success',
        text1: 'Push de teste enviado',
        text2: 'Confira se a notificacao chegou no aparelho.'
      });
    } catch (error) {
      showToast({
        type: 'error',
        text1: 'Falha ao enviar push de teste',
        text2: error instanceof Error ? error.message : undefined
      });
    }
  }, [activeTemplateModel, preferences.expoPushToken, randomTestAmount, refreshPushToken, showToast]);

  const handleLocalPushSuiteTest = useCallback(
    async (model: 'default' | 'creative') => {
      try {
        for (const scenario of LOCAL_TEST_SCENARIOS) {
          await sendLocalNotification(
            scenario.type,
            {
              amount: randomTestAmount(),
              customer: scenario.customer,
              paymentMethod: scenario.paymentMethod
            },
            {
              templateKey: model,
              bypassTypeFilter: true
            }
          );
          await wait(120);
        }

        showToast({
          type: 'success',
          text1: `Teste completo (${model === 'creative' ? 'criativo' : 'padrao'}) enviado`,
          text2: 'Geramos notificacoes para cartao, pix, boleto, pix gerado e boleto gerado.'
        });
      } catch (error) {
        showToast({
          type: 'error',
          text1: 'Falha ao gerar notificacoes de teste',
          text2: error instanceof Error ? error.message : undefined
        });
      }
    },
    [randomTestAmount, showToast]
  );

  return (
    <View style={styles.container}>
      <MedusaHeader title="Configurações" subtitle={displayLabel} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <SectionTitle title="Notificações" />
          <ToggleRow
            label="Saques e Plataformas"
            value={preferences.notifications.withdraws}
            onValueChange={() => toggleNotification('withdraws')}
          />
          <ToggleRow
            label="Venda realizada"
            value={preferences.notifications.sales}
            onValueChange={() => toggleNotification('sales')}
          />
          <ToggleRow
            label="Boleto/Pix gerado"
            value={preferences.notifications.boletoPix}
            onValueChange={() => toggleNotification('boletoPix')}
          />
          <ToggleRow
            label="Som"
            description="Ativar efeitos sonoros nas notificações."
            value={preferences.notifications.sound}
            onValueChange={() => toggleNotification('sound')}
          />
        </Card>

        <Card style={styles.section}>
          <SectionTitle
            title="Modelos de notificação"
            caption="Padrão = objetivo | Criativa = linguagem descontraída"
          />
          <ToggleRow
            label="Notificação padrão"
            value={preferences.notifications.models.default}
            onValueChange={() => handleNotificationModelToggle('default')}
          />
          <ToggleRow
            label="Notificação criativa"
            value={preferences.notifications.models.creative}
            onValueChange={() => handleNotificationModelToggle('creative')}
          />
        </Card>

        <Card style={styles.section}>
          <SectionTitle title="Idioma" />
          <View style={styles.staticRow}>
            <Text style={styles.staticLabel}>Português (pt-BR)</Text>
            <Text style={styles.staticCaption}>
              Outras línguas chegam em breve.
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <SectionTitle title="Visualização" />
          <ToggleRow
            label="Light"
            description="Desative para usar o tema escuro."
            value={preferences.theme === 'light'}
            onValueChange={handleThemeToggle}
          />
        </Card>


        <Card style={styles.section}>
          <SectionTitle title="Dashboards" caption="Selecione qual API deseja visualizar" />
          {dashboards.map((dashboard) => {
            const isActive = dashboard.id === selectedDashboardId;
            const requiresSecondary = dashboard.passkeyField === 'secondarySecretKey';
            const isLocked = requiresSecondary && !profile?.secondarySecretKey;
            const aliasValue = dashboardAliases[dashboard.id] ?? '';
            const resolvedLabel = aliasValue.trim().length ? aliasValue.trim() : dashboard.label;
            return (
              <View key={dashboard.id} style={styles.dashboardGroup}>
                <TouchableOpacity
                  style={[
                    styles.dashboardRow,
                    {
                      borderColor: isActive ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isActive ? 'rgba(5,166,96,0.08)' : 'transparent'
                    }
                  ]}
                  onPress={() => handleDashboardSelect(dashboard.id as DashboardId, dashboard.passkeyField)}
                  disabled={isActive}
                >
                  <View style={styles.dashboardInfo}>
                    <Text style={[styles.dashboardLabel, { color: theme.colors.text }]}>{resolvedLabel}</Text>
                    <Text style={[styles.dashboardDescription, { color: theme.colors.textSecondary }]}>
                      {requiresSecondary ? 'Usa Passkey 2' : 'Usa Passkey 1'}
                    </Text>
                    {isLocked ? (
                      <Text style={[styles.dashboardWarning, { color: theme.colors.danger }]}>
                        Configure a Passkey 2 para liberar.
                      </Text>
                    ) : null}
                  </View>
                  {isActive ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  ) : isLocked ? (
                    <Ionicons name="lock-closed" size={18} color={theme.colors.textSecondary} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={18} color={theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
                <TextField
                  label="Nome personalizado"
                  placeholder={`ex: ${dashboard.shortLabel}`}
                  value={aliasValue}
                  onChangeText={(value) => setDashboardAlias(dashboard.id as DashboardId, value)}
                  containerStyle={styles.dashboardAliasField}
                />
              </View>
            );
          })}
          <PrimaryButton label="Gerenciar passkeys" onPress={handleManagePasskeys} variant="outline" />
        </Card>

        <PrimaryButton label="Sincronizar com o painel" onPress={handleForceSync} variant="outline" />
        <PrimaryButton label="Atualizar push notifications" onPress={handlePushRegistration} variant="outline" />
        <PrimaryButton label="Enviar push de teste (Expo)" onPress={handlePushTest} variant="outline" />
        <PrimaryButton
          label="Rodar teste completo (padrao)"
          onPress={() => {
            void handleLocalPushSuiteTest('default');
          }}
          variant="outline"
        />
        <PrimaryButton
          label="Rodar teste completo (criativa)"
          onPress={() => {
            void handleLocalPushSuiteTest('creative');
          }}
          variant="outline"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 120
  },
  section: {
    padding: 20,
    gap: 12
  },
  staticRow: {
    gap: 6
  },
  staticLabel: {
    fontSize: 16,
    fontWeight: '600'
  },
  staticCaption: {
    fontSize: 13,
    color: '#7A7A7A'
  },
  dashboardGroup: {
    marginTop: 12,
    gap: 8
  },
  dashboardRow: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dashboardInfo: {
    flex: 1,
    marginRight: 12
  },
  dashboardLabel: {
    fontSize: 15,
    fontWeight: '700'
  },
  dashboardDescription: {
    fontSize: 13,
    marginTop: 2
  },
  dashboardWarning: {
    fontSize: 12,
    marginTop: 4
  },
  dashboardAliasField: {
    marginTop: 4
  }
});

export default SettingsScreen;

