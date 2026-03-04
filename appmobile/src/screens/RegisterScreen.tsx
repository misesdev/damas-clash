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
import {register} from '../api/auth';
import {ApiError} from '../api/client';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {colors} from '../theme/colors';

interface RegisterScreenProps {
  onRegistered: (email: string) => void;
  onNavigateToLogin: () => void;
}

type FormErrors = Partial<Record<'username' | 'email' | 'general', string>>;

function validate(username: string, email: string): FormErrors {
  const errors: FormErrors = {};
  if (username.length < 3) {
    errors.username = 'Mínimo 3 caracteres.';
  }
  if (!email.includes('@')) {
    errors.email = 'E-mail inválido.';
  }
  return errors;
}

export function RegisterScreen({onRegistered, onNavigateToLogin}: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const validationErrors = validate(username, email);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({username, email});
      onRegistered(email);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.message === 'email_taken') {
          setErrors({email: 'E-mail já cadastrado.'});
        } else if (e.message === 'username_taken') {
          setErrors({username: 'Nome de usuário já existe.'});
        } else {
          setErrors({general: 'Erro ao criar conta. Tente novamente.'});
        }
      } else {
        setErrors({general: 'Erro de conexão. Tente novamente.'});
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

        <TouchableOpacity
          onPress={onNavigateToLogin}
          style={styles.back}
          testID="back-button">
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome de usuário"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            placeholder="seu_usuario"
            error={errors.username}
            testID="username-input"
          />
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="seu@email.com"
            error={errors.email}
            testID="email-input"
          />

          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="general-error">
                {errors.general}
              </Text>
            </View>
          ) : null}

          <Button
            label="Criar conta"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
            testID="register-button"
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onNavigateToLogin} testID="login-link">
            <Text style={styles.footerText}>
              Já tem conta? <Text style={styles.footerLink}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {flexGrow: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40},

  back: {marginBottom: 48},
  backText: {color: colors.textMuted, fontSize: 14, fontWeight: '500'},

  header: {marginBottom: 36},
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {color: colors.textMuted, fontSize: 15, lineHeight: 22},

  form: {marginBottom: 32},
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
