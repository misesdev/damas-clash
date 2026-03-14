import React from 'react';
import {KeyboardAvoidingView, Platform, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {ScreenHeader} from '../components/ScreenHeader';
import {useNostrLogin} from '../hooks/useNostrLogin';
import {styles} from '../styles/nostrLoginStyles';
import type {LoginResponse} from '../types/auth';

interface Props {
  onLogin: (data: LoginResponse) => void;
  onBack: () => void;
}

export function NostrLoginScreen({onLogin, onBack}: Props) {
  const {t} = useTranslation();
  const {nsec, setNsec, status, error, handleLogin, canSubmit} = useNostrLogin(onLogin);

  const loading = status === 'loading';

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('nostrLogin.title')} onBack={onBack} />
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={styles.form}>
          <View style={styles.brandRow}>
            <Text style={styles.brandIcon}>⚡</Text>
            <Text style={styles.brandLabel}>Nostr</Text>
          </View>
          <Text style={styles.description}>{t('nostrLogin.nsecHint')}</Text>

          <Input
            label={t('nostrLogin.nsecLabel')}
            placeholder={t('nostrLogin.nsecPlaceholder')}
            value={nsec}
            onChangeText={setNsec}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            testID="nsec-input"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Button
            label={loading ? t('nostrLogin.signingChallenge') : t('nostrLogin.loginButton')}
            onPress={handleLogin}
            loading={loading}
            disabled={!canSubmit}
            testID="nostr-login-button"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
