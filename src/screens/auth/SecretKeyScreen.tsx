import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useToast } from '@/hooks/useToast';

const SecretKeyScreen: React.FC = () => {
  const { theme } = usePreferences();
  const { profile, saveSecretKeys, signOut } = useAuth();
  const { showToast } = useToast();
  const [secretKey, setSecretKey] = useState(profile?.secretKey ?? '');
  const [secondarySecretKey, setSecondarySecretKey] = useState(profile?.secondarySecretKey ?? '');
  const [recipientId, setRecipientId] = useState(profile?.recipientId ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSecretKey(profile?.secretKey ?? '');
  }, [profile?.secretKey]);

  useEffect(() => {
    setSecondarySecretKey(profile?.secondarySecretKey ?? '');
  }, [profile?.secondarySecretKey]);

  useEffect(() => {
    setRecipientId(profile?.recipientId ?? '');
  }, [profile?.recipientId]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      await saveSecretKeys({
        secretKey,
        secondarySecretKey,
        recipientId
      });
      showToast({
        type: 'success',
        text1: 'Passkeys salvas',
        text2: 'Voce pode alternar entre os dashboards nas configuracoes.'
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
  }, [recipientId, saveSecretKeys, secondarySecretKey, secretKey, showToast]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Informe suas Passkeys</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Passkey 1 e obrigatoria para liberar o app. A Passkey 2 e opcional e libera o Dashboard 2 descrito na
            documentacao fornecida.
          </Text>

          <TextField
            label="Passkey 1 (obrigatoria)"
            placeholder="sk_live_xxx..."
            value={secretKey}
            onChangeText={setSecretKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Passkey 2 (opcional)"
            placeholder="sk_live_xxx..."
            value={secondarySecretKey}
            onChangeText={setSecondarySecretKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label="Recipient ID (opcional)"
            placeholder="ex: 123456"
            value={recipientId}
            onChangeText={setRecipientId}
            keyboardType="number-pad"
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
