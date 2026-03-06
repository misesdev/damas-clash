import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {BoardMark} from '../components/BoardMark';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {useLogin} from '../hooks/useLogin';
import {styles} from '../styles/loginStyles';

interface LoginScreenProps {
  onCodeSent: (email: string) => void;
  onNavigateToRegister: () => void;
}

export function LoginScreen({onCodeSent, onNavigateToRegister}: LoginScreenProps) {
  const {identifier, setIdentifier, error, loading, handleLogin} = useLogin(onCodeSent);

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
