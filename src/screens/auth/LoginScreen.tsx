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

type LoginScreenProps = {
  navigation: any;
};

const logo = require('../../../assets/logo-horizontal-branca.png');

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme } = usePreferences();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNavigate = useCallback(
    (screen: 'Register' | 'ForgotPassword') => {
      navigation.navigate(screen);
    },
    [navigation]
  );

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password) {
      showToast({
        type: 'info',
        text1: 'Preencha email e senha'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(email, password);
      showToast({
        type: 'success',
        text1: 'Bem-vindo de volta'
      });
    } catch (error) {
      showToast({
        type: 'error',
        text1: 'Falha no login',
        text2: error instanceof Error ? error.message : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, showToast, signIn]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.title, { color: theme.colors.text }]}>Bem-vindo de volta</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Entre com as credenciais do seu painel Medusa Pay.
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

            <TextField
              label="Senha"
              placeholder="Sua senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
            />

            <TouchableOpacity style={styles.link} onPress={() => handleNavigate('ForgotPassword')}>
              <Text style={[styles.linkLabel, { color: theme.colors.primary }]}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <PrimaryButton label="Entrar" onPress={handleSubmit} loading={isSubmitting} />

            <View style={styles.registerHint}>
              <Text style={[styles.registerText, { color: theme.colors.textSecondary }]}>
                Ainda nao tem conta?
              </Text>
              <TouchableOpacity onPress={() => handleNavigate('Register')}>
                <Text style={[styles.linkLabel, { color: theme.colors.primary }]}>Criar conta</Text>
              </TouchableOpacity>
            </View>
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
  link: {
    alignItems: 'flex-end'
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600'
  },
  registerHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24
  },
  registerText: {
    fontSize: 14
  }
});

export default LoginScreen;
