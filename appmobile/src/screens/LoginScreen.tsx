import React from 'react';
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
import {WEB_URL} from '@env';
import {BoardMark} from '../components/BoardMark';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {useLogin} from '../hooks/useLogin';
import {styles} from '../styles/loginStyles';

interface LoginScreenProps {
  onCodeSent: (email: string) => void;
  onNavigateToRegister: () => void;
  onNostrLogin: () => void;
}

export function LoginScreen({onCodeSent, onNavigateToRegister, onNostrLogin}: LoginScreenProps) {
  const {t} = useTranslation();
  const {identifier, setIdentifier, error, loading, handleLogin} = useLogin(onCodeSent);

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

        <View style={styles.nostrSection}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.nostrButton}
            onPress={onNostrLogin}
            testID="nostr-login-button">
            <Text style={styles.nostrButtonText}>
              ⚡ {t('login.nostrButton')}
            </Text>
          </TouchableOpacity>
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
