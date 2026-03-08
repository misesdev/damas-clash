import React, {useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';
import {WEB_URL} from '@env';
import {googleAuth} from '../api/auth';
import {BoardMark} from '../components/BoardMark';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {useLogin} from '../hooks/useLogin';
import {styles} from '../styles/loginStyles';
import type {LoginResponse} from '../types/auth';

GoogleSignin.configure({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
});

interface LoginScreenProps {
  onCodeSent: (email: string) => void;
  onNavigateToRegister: () => void;
  onGoogleLogin: (data: LoginResponse) => void;
}

export function LoginScreen({onCodeSent, onNavigateToRegister, onGoogleLogin}: LoginScreenProps) {
  const {identifier, setIdentifier, error, loading, handleLogin} = useLogin(onCodeSent);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('no_id_token');
      const data = await googleAuth(idToken);
      onGoogleLogin(data);
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — do nothing
      } else {
        setGoogleError('Erro ao entrar com Google. Tente novamente.');
      }
    } finally {
      setGoogleLoading(false);
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
          <BoardMark size={85} />
          <Text style={styles.appName}>DAMAS CLASH</Text>
          <Text style={styles.subtitle}>Use seu usuário ou e-mail para continuar</Text>
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

        <View style={{marginBottom: 8}}>
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#444',
              backgroundColor: '#1a1a1a',
            }}>
            {googleLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{fontSize: 15, fontWeight: '600', color: '#fff'}}>
                Continuar com Google
              </Text>
            )}
          </TouchableOpacity>
          {googleError ? (
            <Text style={{color: '#ff453a', fontSize: 12, textAlign: 'center', marginTop: 6}}>
              {googleError}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onNavigateToRegister} testID="register-link">
            <Text style={styles.footerText}>
              Não tem conta?{' '}
              <Text style={styles.footerLink}>Criar conta</Text>
            </Text>
          </TouchableOpacity>
          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL(`${WEB_URL}/termos`)}>
              <Text style={styles.legalLink}>Termos de Uso</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`${WEB_URL}/privacidade`)}>
              <Text style={styles.legalLink}>Privacidade</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
