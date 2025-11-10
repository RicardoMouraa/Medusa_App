import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useToast } from '@/hooks/useToast';

type RegisterScreenProps = {
  navigation: any;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { theme } = usePreferences();
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password) {
      showToast({
        type: 'info',
        text1: 'Preencha todos os campos'
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        type: 'error',
        text1: 'As senhas nao conferem'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await signUp({ name, email, password });
      showToast({
        type: 'success',
        text1: 'Conta criada',
        text2: 'Confirme sua Secret Key para acessar os dados.'
      });
    } catch (error) {
      showToast({
        type: 'error',
        text1: 'Nao foi possivel cadastrar',
        text2: error instanceof Error ? error.message : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmPassword, email, name, password, showToast, signUp]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Criar conta</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Use o mesmo email configurado no painel Medusa Pay.
          </Text>
        </View>

        <View style={styles.form}>
          <TextField label="Nome completo" placeholder="Seu nome" value={name} onChangeText={setName} />

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
            placeholder="Minimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoComplete="password-new"
          />

          <TextField
            label="Confirmar senha"
            placeholder="Repita a senha"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="password-new"
          />

          <PrimaryButton label="Cadastrar" onPress={handleSubmit} loading={isSubmitting} />

          <View style={styles.loginHint}>
            <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
              Ja possui acesso?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkLabel, { color: theme.colors.primary }]}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center'
  },
  header: {
    marginBottom: 24,
    gap: 8
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
  loginHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24
  },
  loginText: {
    fontSize: 14
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600'
  }
});

export default RegisterScreen;
