import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import SectionTitle from '@/components/SectionTitle';
import ToggleRow from '@/components/ToggleRow';
import MedusaHeader from '@/components/MedusaHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { usePreferences } from '@/context/PreferencesContext';
import { useToast } from '@/hooks/useToast';

const SettingsScreen: React.FC = () => {
  const { preferences, setTheme, toggleNotification, toggleNotificationModel, refreshFromServer, refreshPushToken } =
    usePreferences();
  const { showToast } = useToast();

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
      <MedusaHeader title="Configurações" />
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
  }
});

export default SettingsScreen;
