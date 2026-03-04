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
import {BoardMark} from '../components/BoardMark';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {colors} from '../theme/colors';

interface LoginScreenProps {
  onCodeSent: (email: string) => void;
  onNavigateToRegister: () => void;
}

export function LoginScreen({onCodeSent, onNavigateToRegister}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const {email} = await login({identifier});
      onCodeSent(email);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.status === 403
            ? 'Confirme seu e-mail antes de entrar.'
            : 'Usuário não encontrado.',
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

        <View style={styles.logoArea}>
          <BoardMark size={44} />
          <Text style={styles.appName}>DAMAS</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Usuário ou e-mail"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoComplete="email"
            placeholder="seu_usuario ou seu@email.com"
            testID="identifier-input"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="error-message">
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            label="Continuar"
            onPress={handleLogin}
            loading={loading}
            disabled={!identifier.trim()}
            style={styles.submitButton}
            testID="login-button"
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onNavigateToRegister} testID="register-link">
            <Text style={styles.footerText}>
              Não tem conta?{' '}
              <Text style={styles.footerLink}>Criar conta</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center'},

  logoArea: {
    alignItems: 'center',
    marginBottom: 56,
  },
  appName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 8,
    marginTop: 18,
  },

  form: {marginBottom: 36},
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {color: colors.error, fontSize: 14, lineHeight: 20},
  submitButton: {marginTop: 16},

  footer: {alignItems: 'center', gap: 18},
  divider: {width: 32, height: 1, backgroundColor: colors.border},
  footerText: {color: colors.textMuted, fontSize: 14},
  footerLink: {color: colors.textSecondary, fontWeight: '600'},
});
