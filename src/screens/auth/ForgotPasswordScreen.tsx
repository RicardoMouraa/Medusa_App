import React, { useCallback, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useToast } from '@/hooks/useToast';

type ForgotPasswordScreenProps = {
  navigation: any;
};

const logo = require('../../../assets/logo-horizontal-branca.png');

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { theme } = usePreferences();
  const { requestPasswordReset } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      showToast({
        type: 'info',
        text1: 'Informe o email cadastrado'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset(email);
      showToast({
        type: 'success',
        text1: 'Email enviado',
        text2: 'Verifique sua caixa de entrada para redefinir a senha.'
      });
      navigation.navigate('Login');
    } catch (error) {
      showToast({
        type: 'error',
        text1: 'Nao foi possivel enviar',
        text2: error instanceof Error ? error.message : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, navigation, requestPasswordReset, showToast]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.title, { color: theme.colors.text }]}>Recuperar senha</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enviaremos um email com o link de redefinicao.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Email"
              placeholder="voce@empresa.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
            />

            <PrimaryButton label="Enviar" onPress={handleSubmit} loading={isSubmitting} />

            <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkLabel, { color: theme.colors.primary }]}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  flex: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center'
  },
  brand: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 32
  },
  logo: {
    width: 160,
    height: 60
  },
  title: {
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20
  },
  form: {
    gap: 16
  },
  backLink: {
    alignItems: 'center'
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600'
  }
});

export default ForgotPasswordScreen;
