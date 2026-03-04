import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {confirmEmail} from '../api/auth';
import {ApiError} from '../api/client';
import {Button} from '../components/Button';
import {OtpInput} from '../components/OtpInput';
import {colors} from '../theme/colors';

const RESEND_COOLDOWN = 60;

interface ConfirmEmailScreenProps {
  email: string;
  onConfirmed: () => void;
  onNavigateToLogin: () => void;
  // Optional: overrides the default confirmEmail call (e.g. for login verification)
  onSubmitCode?: (code: string) => Promise<void>;
  // Optional: called when user requests a new code; if omitted resend button is hidden
  onResendCode?: () => Promise<void>;
  heading?: string;
}

export function ConfirmEmailScreen({
  email,
  onConfirmed,
  onNavigateToLogin,
  onSubmitCode,
  onResendCode,
  heading = 'Verifique\nseu e-mail',
}: ConfirmEmailScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleResend = async () => {
    if (!onResendCode || resendCooldown > 0) return;
    try {
      await onResendCode();
      setResendSuccess(true);
      setError('');
      startCooldown();
    } catch {
      setError('Erro ao reenviar o código. Tente novamente.');
    }
  };

  const handleConfirm = async () => {
    setError('');
    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos.');
      return;
    }
    setLoading(true);
    try {
      if (onSubmitCode) {
        await onSubmitCode(code);
        // parent handles navigation after success
      } else {
        await confirmEmail({email, code});
        onConfirmed();
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError('Código inválido ou expirado. Tente novamente.');
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

        <View style={styles.iconBox}>
          <Text style={styles.icon}>✉</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.subtitle}>
            Enviamos um código de 6 dígitos para{'\n'}
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
            label="Confirmar"
            onPress={handleConfirm}
            loading={loading}
            style={styles.submitButton}
            testID="confirm-button"
          />

          {onResendCode ? (
            <View style={styles.resendArea}>
              {resendSuccess && resendCooldown > 0 ? (
                <Text style={styles.resendSuccess} testID="resend-success">
                  Código reenviado ✓
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendCooldown > 0}
                testID="resend-button">
                <Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>
                  {resendCooldown > 0
                    ? `Reenviar código em ${resendCooldown}s`
                    : 'Não recebeu? Reenviar código'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onNavigateToLogin} testID="login-link">
            <Text style={styles.footerText}>
              Voltar para o <Text style={styles.footerLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', paddingVertical: 60},

  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  icon: {fontSize: 26},

  header: {marginBottom: 40},
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
    lineHeight: 38,
  },
  subtitle: {color: colors.textMuted, fontSize: 15, lineHeight: 24},
  emailText: {color: colors.textSecondary, fontWeight: '600'},

  form: {marginBottom: 44},
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  errorText: {color: colors.error, fontSize: 14, lineHeight: 20},
  submitButton: {marginTop: 24},

  resendArea: {alignItems: 'center', marginTop: 20, gap: 6},
  resendSuccess: {color: colors.textSecondary, fontSize: 13},
  resendText: {color: colors.textSecondary, fontSize: 13, fontWeight: '500'},
  resendDisabled: {color: colors.textMuted},

  footer: {alignItems: 'center', gap: 18},
  divider: {width: 32, height: 1, backgroundColor: colors.border},
  footerText: {color: colors.textMuted, fontSize: 14},
  footerLink: {color: colors.textSecondary, fontWeight: '600'},
});
