import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';
import {WEB_URL, GOOGLE_WEB_CLIENT_ID} from '@env';
import {googleAuth} from '../api/auth';
import {BoardMark} from '../components/BoardMark';
import {Button} from '../components/Button';
import {GoogleButton} from '../components/GoogleButton';
import {Input} from '../components/Input';
import {useLogin} from '../hooks/useLogin';
import {styles} from '../styles/loginStyles';
import type {LoginResponse} from '../types/auth';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

interface LoginScreenProps {
  onCodeSent: (email: string) => void;
  onNavigateToRegister: () => void;
  onGoogleLogin: (data: LoginResponse) => void;
}

export function LoginScreen({onCodeSent, onNavigateToRegister, onGoogleLogin}: LoginScreenProps) {
  const {t} = useTranslation();
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
        setGoogleError(t('login.googleError'));
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
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('login.inputLabel')}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoComplete="email"
            placeholder={t('login.inputPlaceholder')}
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
            label={t('login.continueButton')}
            onPress={handleLogin}
            loading={loading}
            disabled={!identifier.trim()}
            style={styles.submitButton}
            testID="login-button"
          />
        </View>

        <View style={styles.googleSection}>
          <View style={styles.divider} />
          <GoogleButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
          />
          {googleError ? (
            <Text style={styles.googleError}>{googleError}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onNavigateToRegister} testID="register-link">
            <Text style={styles.footerText}>
              {t('login.noAccount')}{' '}
              <Text style={styles.footerLink}>{t('login.createAccount')}</Text>
            </Text>
          </TouchableOpacity>
          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL(`${WEB_URL}/termos`)}>
              <Text style={styles.legalLink}>{t('login.terms')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`${WEB_URL}/privacidade`)}>
              <Text style={styles.legalLink}>{t('login.privacy')}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
