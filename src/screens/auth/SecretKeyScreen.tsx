import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useToast } from '@/hooks/useToast';

const SecretKeyScreen: React.FC = () => {
  const { theme } = usePreferences();
  const { profile, saveSecretKey, signOut } = useAuth();
  const { showToast } = useToast();
  const [secretKey, setSecretKey] = useState(profile?.secretKey ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.secretKey && !secretKey) {
      setSecretKey(profile.secretKey);
    }
  }, [profile?.secretKey, secretKey]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      await saveSecretKey(secretKey);
      showToast({
        type: 'success',
        text1: 'Secret Key salva',
        text2: 'Agora seus dados serao carregados direto do gateway.'
      });
    } catch (error) {
      showToast({
        type: 'error',
        text1: 'Nao foi possivel salvar',
        text2: error instanceof Error ? error.message : undefined
      });
    } finally {
      setIsSaving(false);
    }
  }, [saveSecretKey, secretKey, showToast]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Informe sua Secret Key</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Copie a chave no painel do Medusa Pay (Menu &gt; API Keys) e cole abaixo. Ela sera usada para assinar
            as chamadas usando o header Basic conforme a documentacao oficial.
          </Text>

          <TextField
            label="Secret Key"
            placeholder="sk_live_xxx..."
            value={secretKey}
            onChangeText={setSecretKey}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <PrimaryButton label="Salvar Secret Key" onPress={handleSave} loading={isSaving} />
        </View>

        <PrimaryButton label="Sair da conta" variant="outline" onPress={handleSignOut} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 24
  },
  card: {
    padding: 24,
    borderRadius: 24,
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.04)'
  },
  title: {
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20
  }
});

export default SecretKeyScreen;
