import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {login} from '../api/auth';
import {ApiError} from '../api/client';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';

interface LoginScreenProps {
  onLoginSuccess: (data: LoginResponse) => void;
  onNavigateToRegister: () => void;
}

export function LoginScreen({
  onLoginSuccess,
  onNavigateToRegister,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await login({email, password});
      onLoginSuccess(data);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.status === 403
            ? 'Confirme seu e-mail antes de entrar.'
            : 'E-mail ou senha incorretos.',
        );
      } else {
        setError('Erro de conexão. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>damas</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="seu@email.com"
            testID="email-input"
          />
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
            testID="password-input"
          />

          {error ? (
            <Text style={styles.error} testID="error-message">
              {error}
            </Text>
          ) : null}

          <Button
            label="Entrar"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password}
            style={styles.submitButton}
            testID="login-button"
          />
        </View>

        <TouchableOpacity
          onPress={onNavigateToRegister}
          style={styles.link}
          testID="register-link">
          <Text style={styles.linkText}>
            Não tem conta?{' '}
            <Text style={styles.linkBold}>Criar conta</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {flexGrow: 1, padding: 32, justifyContent: 'center'},
  header: {marginBottom: 48},
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {color: colors.textMuted, fontSize: 16},
  form: {marginBottom: 32},
  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  submitButton: {marginTop: 8},
  link: {alignItems: 'center'},
  linkText: {color: colors.textMuted, fontSize: 14},
  linkBold: {color: colors.text, fontWeight: '600'},
});
