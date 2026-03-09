import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Button} from '../components/Button';
import {OtpInput} from '../components/OtpInput';
import {useConfirmEmail} from '../hooks/useConfirmEmail';
import {styles} from '../styles/confirmEmailStyles';
import type {LoginResponse} from '../types/auth';

interface ConfirmEmailScreenProps {
  email: string;
  onConfirmed: (data?: LoginResponse) => void;
  onNavigateToLogin: () => void;
  onSubmitCode?: (code: string) => Promise<void>;
  onResendCode?: () => Promise<void>;
  heading?: string;
}

export function ConfirmEmailScreen({
  email,
  onConfirmed,
  onNavigateToLogin,
  onSubmitCode,
  onResendCode,
  heading,
}: ConfirmEmailScreenProps) {
  const {t} = useTranslation();
  const resolvedHeading = heading ?? t('confirmEmail.defaultHeading');
  const {
    code,
    setCode,
    error,
    loading,
    resendCooldown,
    resendSuccess,
    handleResend,
    handleConfirm,
  } = useConfirmEmail({email, onConfirmed, onSubmitCode, onResendCode});

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">

        <View style={styles.iconBox}>
          <Text style={styles.icon}>✉</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{resolvedHeading}</Text>
          <Text style={styles.subtitle}>
            {t('confirmEmail.codeSentTo')}{'\n'}
            <Text style={styles.emailText} testID="email-display">
              {email}
            </Text>
          </Text>
        </View>

        <View style={styles.form}>
          <OtpInput
            value={code}
            onChange={setCode}
            error={!!error}
            testID="code-input"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={t('confirmEmail.confirmButton')}
            onPress={handleConfirm}
            loading={loading}
            style={styles.submitButton}
            testID="confirm-button"
          />

          {onResendCode ? (
            <View style={styles.resendArea}>
              {resendSuccess && resendCooldown > 0 ? (
                <Text style={styles.resendSuccess} testID="resend-success">
                  {t('confirmEmail.resendSuccess')}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendCooldown > 0}
                testID="resend-button">
                <Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>
                  {resendCooldown > 0
                    ? t('confirmEmail.resendCooldown', {seconds: resendCooldown})
                    : t('confirmEmail.resendPrompt')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onNavigateToLogin} testID="login-link">
            <Text style={styles.footerText}>
              {t('confirmEmail.backTo')} <Text style={styles.footerLink}>{t('confirmEmail.loginLink')}</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
