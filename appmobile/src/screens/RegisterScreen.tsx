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

type FormErrors = Partial<Record<'username' | 'email' | 'password' | 'general', string>>;

function validate(username: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (username.length < 3) {
    errors.username = 'Mínimo 3 caracteres.';
  }
  if (!email.includes('@')) {
    errors.email = 'E-mail inválido.';
  }
  if (password.length < 8) {
    errors.password = 'Mínimo 8 caracteres.';
  } else if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    errors.password = 'Precisa ter maiúsculas, minúsculas e número.';
  }
  return errors;
}

export function RegisterScreen({
  onRegistered,
  onNavigateToLogin,
}: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const validationErrors = validate(username, email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({username, email, password});
      onRegistered(email);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.message === 'email_taken') {
          setErrors({email: 'E-mail já cadastrado.'});
        } else if (e.message === 'username_taken') {
          setErrors({username: 'Nome de usuário já existe.'});
        } else if (e.message === 'password_weak') {
          setErrors({password: 'Senha fraca.'});
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
          style={styles.backButton}
          testID="back-button">
          <Text style={styles.backText}>← Login</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Comece a jogar agora</Text>
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
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password}
            testID="password-input"
          />

          {errors.general ? (
            <Text style={styles.error} testID="general-error">
              {errors.general}
            </Text>
          ) : null}

          <Button
            label="Criar conta"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
            testID="register-button"
          />
        </View>

        <TouchableOpacity
          onPress={onNavigateToLogin}
          style={styles.link}
          testID="login-link">
          <Text style={styles.linkText}>
            Já tem conta? <Text style={styles.linkBold}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {flexGrow: 1, padding: 32, paddingTop: 60},
  backButton: {marginBottom: 40},
  backText: {color: colors.textMuted, fontSize: 14},
  header: {marginBottom: 40},
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {color: colors.textMuted, fontSize: 16},
  form: {marginBottom: 32},
  error: {color: colors.error, fontSize: 14, marginBottom: 16},
  submitButton: {marginTop: 8},
  link: {alignItems: 'center'},
  linkText: {color: colors.textMuted, fontSize: 14},
  linkBold: {color: colors.text, fontWeight: '600'},
});
