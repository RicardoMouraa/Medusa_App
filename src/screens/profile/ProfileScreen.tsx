import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useToast } from '@/hooks/useToast';
import { getCompany } from '@/services/medusaApi';
import { useDashboard } from '@/hooks/useDashboard';

const maskSecretKey = (secret?: string | null) => {
  if (!secret) return 'Nao informada';
  if (secret.length <= 8) return '****';
  const start = secret.slice(0, 4);
  const end = secret.slice(-4);
  return `${start}****${end}`;
};

const formatCompanyField = (value: unknown): string => {
  if (value === null || value === undefined) return '---';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const rendered = value.map(formatCompanyField).filter((item) => item !== '---');
    return rendered.length ? rendered.join(' ') : '---';
  }
  if (typeof value === 'object') {
    const candidate =
      (value as Record<string, unknown>).formatted ??
      (value as Record<string, unknown>).value ??
      (value as Record<string, unknown>).number ??
      (value as Record<string, unknown>).text;
    if (candidate) {
      const formatted = formatCompanyField(candidate);
      if (formatted !== '---') return formatted;
    }
    const joined = Object.values(value as Record<string, unknown>)
      .filter((entry) => typeof entry === 'string' || typeof entry === 'number')
      .map((entry) => String(entry))
      .join(' ');
    return joined || '---';
  }
  return String(value);
};

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { profile, requestPasswordReset, signOut, updateProfileDetails } = useAuth();
  const { definition, secretKey, apiOptions, displayLabel } = useDashboard();
  const { theme } = usePreferences();
  const { showToast } = useToast();
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const {
    data: company,
    isLoading: isCompanyLoading
  } = useApiRequest<Record<string, unknown>>(
    () => {
      if (!secretKey) {
        throw new Error(`Informe ${definition.passkeyLabel} para carregar os dados do ${displayLabel}.`);
      }
      return getCompany(secretKey, apiOptions);
    },
    [apiOptions, definition.passkeyLabel, displayLabel, secretKey],
    {
      immediate: Boolean(secretKey)
    }
  );

  const handleOpenSettings = useCallback(() => {
    navigation.navigate('App', { screen: 'SettingsTab' });
  }, [navigation]);

  useEffect(() => {
    setName(profile?.name ?? '');
    setEmail(profile?.email ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.name, profile?.email, profile?.phone]);

  const initials = useMemo(() => {
    if (!profile?.name) return 'MP';
    const segments = profile.name.trim().split(' ');
    const first = segments[0]?.[0] ?? '';
    const last = segments.length > 1 ? segments[segments.length - 1]?.[0] ?? '' : '';
    return `${first}${last}`.toUpperCase();
  }, [profile?.name]);

  const maskedSecretKeyActive = useMemo(() => maskSecretKey(secretKey), [secretKey]);
  const maskedPrimarySecretKey = useMemo(() => maskSecretKey(profile?.secretKey), [profile?.secretKey]);
  const maskedSecondarySecretKey = useMemo(
    () => maskSecretKey(profile?.secondarySecretKey),
    [profile?.secondarySecretKey]
  );

  const handlePasswordReset = useCallback(async () => {
    if (!profile?.email) {
      showToast({
        type: 'info',
        text1: 'Informe um email',
        text2: 'Cadastre um email para receber o link de troca.'
      });
      return;
    }
    await requestPasswordReset(profile.email);
    showToast({
      type: 'success',
      text1: 'Link enviado',
      text2: 'Veja sua caixa de entrada.'
    });
  }, [profile?.email, requestPasswordReset, showToast]);

  const handleManagePasskeys = useCallback(() => {
    navigation.navigate('SecretKey');
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSavingProfile(true);
      await updateProfileDetails({ name, email, phone });
      showToast({
        type: 'success',
        text1: 'Dados atualizados',
        text2: 'Suas informações foram salvas.'
      });
    } catch (error) {
      showToast({
        type: 'error',
        text1: 'Não foi possível salvar',
        text2: error instanceof Error ? error.message : undefined
      });
    } finally {
      setIsSavingProfile(false);
    }
  }, [email, name, phone, showToast, updateProfileDetails]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Meu perfil</Text>
          <View style={styles.backButton} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.card, styles.heroCard]}>
          <View style={styles.heroHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: theme.colors.text }]}>{profile?.name ?? 'Usuário'}</Text>
              <Text style={[styles.heroEmail, { color: theme.colors.textSecondary }]}>{profile?.email ?? '---'}</Text>
              <View style={styles.secretPill}>
                <Text style={styles.secretLabel}>{definition.passkeyLabel}</Text>
                <Text style={styles.secretValue}>{maskedSecretKeyActive}</Text>
              </View>
            </View>
          </View>
          <PrimaryButton
            label="Preferências e notificações"
            onPress={handleOpenSettings}
            variant="outline"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Dados pessoais</Text>
          <TextField label="Nome completo" value={name} onChangeText={setName} />
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextField label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <PrimaryButton
            label="Salvar dados pessoais"
            onPress={handleSaveProfile}
            loading={isSavingProfile}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Empresa</Text>
          {isCompanyLoading ? (
            <Text style={{ color: theme.colors.textSecondary }}>Carregando dados da empresa...</Text>
          ) : company ? (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Nome</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {formatCompanyField(
                    (company.businessName as string) ??
                      (company.legalName as string) ??
                      (company.name as string)
                  )}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Documento</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {formatCompanyField((company.document as unknown) ?? company.documentNumber)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Email suporte</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {formatCompanyField(company.email)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: theme.colors.textSecondary }}>
              Nao encontramos os dados da empresa para a Secret Key atual.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Segurança</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Passkey 1</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{maskedPrimarySecretKey}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Passkey 2</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{maskedSecondarySecretKey}</Text>
          </View>
          <PrimaryButton label="Gerenciar passkeys" onPress={handleManagePasskeys} variant="outline" />
          <PrimaryButton label="Trocar senha" onPress={handlePasswordReset} variant="outline" />
          <PrimaryButton label="Sair da conta" onPress={handleLogout} />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
    paddingHorizontal: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 80
  },
  card: {
    padding: 20,
    gap: 12
  },
  heroCard: {
    gap: 16,
    backgroundColor: 'rgba(5, 166, 96, 0.08)'
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center'
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05A660'
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800'
  },
  heroInfo: {
    flex: 1,
    gap: 6
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800'
  },
  heroEmail: {
    fontSize: 14
  },
  secretPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF'
  },
  secretLabel: {
    fontSize: 11,
    color: '#7A8A80',
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  secretValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#05A660'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 13
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600'
  }
});

export default ProfileScreen;
