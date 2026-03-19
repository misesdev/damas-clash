import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
  const {nsec, setNsec, status, error, handleLogin, handleSignerLogin, canSubmit} =
    useNostrLogin(onLogin);

  const loading = status === 'loading';
  const signerLoading = status === 'signerLoading';
  const busy = loading || signerLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('nostrLogin.title')} onBack={onBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Intro ── */}
          <View style={styles.intro}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⚡</Text>
            </View>
            <Text style={styles.introTitle}>{t('nostrLogin.introTitle')}</Text>
            <Text style={styles.introSubtitle}>{t('nostrLogin.introSubtitle')}</Text>
          </View>

          {/* ── App Signer ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('nostrLogin.signerSectionLabel')}</Text>
            <TouchableOpacity
              style={[styles.signerCard, busy && styles.signerCardDisabled]}
              onPress={handleSignerLogin}
              disabled={busy}
              activeOpacity={0.7}
              testID="signer-login-button">
              <View style={styles.signerIconBox}>
                <Text style={styles.signerIconText}>🔑</Text>
              </View>
              <View style={styles.signerInfo}>
                <Text style={styles.signerTitle}>{t('nostrLogin.signerCardTitle')}</Text>
                <Text style={styles.signerDesc}>{t('nostrLogin.signerCardDesc')}</Text>
              </View>
              <View style={styles.signerTrailing}>
                {signerLoading ? (
                  <ActivityIndicator size="small" color="#888" />
                ) : (
                  <Text style={styles.chevron}>›</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('nostrLogin.orNsec')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── nsec section ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('nostrLogin.nsecSectionLabel')}</Text>
            <Text style={styles.nsecHint}>{t('nostrLogin.nsecHint')}</Text>
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
          </View>

          {/* ── Error ── */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Sign-in button (nsec path) ── */}
          <Button
            label={loading ? t('nostrLogin.signingChallenge') : t('nostrLogin.loginButton')}
            onPress={handleLogin}
            loading={loading}
            disabled={!canSubmit}
            style={styles.loginButton}
            testID="nostr-login-button"
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
