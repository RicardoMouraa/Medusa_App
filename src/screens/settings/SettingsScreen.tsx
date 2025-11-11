import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/Card';
import SectionTitle from '@/components/SectionTitle';
import ToggleRow from '@/components/ToggleRow';
import MedusaHeader from '@/components/MedusaHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { usePreferences } from '@/context/PreferencesContext';
import { useToast } from '@/hooks/useToast';
import { useDashboard, getAvailableDashboards } from '@/hooks/useDashboard';
import type { DashboardId } from '@/types/dashboard';
import { useAuth } from '@/context/AuthContext';

const SettingsScreen: React.FC = () => {
  const {
    preferences,
    theme,
    setTheme,
    toggleNotification,
    toggleNotificationModel,
    refreshFromServer,
    refreshPushToken,
    setDashboard
  } = usePreferences();
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const { definition, selectedDashboardId } = useDashboard();
  const { showToast } = useToast();
  const dashboards = useMemo(() => getAvailableDashboards(), []);

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
      text1: token ? 'Push configurado' : 'Permissão necessária',
      text2: token
        ? 'Suas notificações push foram atualizadas.'
        : 'Autorize notificações nas configurações do dispositivo.'
    });
  }, [refreshPushToken, showToast]);

  return (
    <View style={styles.container}>
      <MedusaHeader title="Configurações" subtitle={definition.shortLabel} />
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
          <SectionTitle title="Modelos de notificação" caption="Personalize o tom da mensagem" />
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
            return (
              <TouchableOpacity
                key={dashboard.id}
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
                  <Text style={[styles.dashboardLabel, { color: theme.colors.text }]}>{dashboard.label}</Text>
                  <Text style={[styles.dashboardDescription, { color: theme.colors.textSecondary }]}>
                    {requiresSecondary ? 'Usa Passkey 2' : 'Usa Passkey 1'}
                  </Text>
                  {isLocked ? (
                    <Text style={[styles.dashboardWarning, { color: theme.colors.danger }]}>Configure a Passkey 2 para liberar.</Text>
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
            );
          })}
          <PrimaryButton label="Gerenciar passkeys" onPress={handleManagePasskeys} variant="outline" />
        </Card>

        <PrimaryButton label="Sincronizar com o painel" onPress={handleForceSync} variant="outline" />
        <PrimaryButton label="Atualizar push notifications" onPress={handlePushRegistration} variant="outline" />
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
  dashboardRow: {
    marginTop: 12,
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
  }
});

export default SettingsScreen;
