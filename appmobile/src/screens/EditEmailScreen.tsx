import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {confirmEmailChange, requestEmailChange} from '../api/players';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {OtpInput} from '../components/OtpInput';
import {ScreenHeader} from '../components/ScreenHeader';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';

interface Props {
  user: LoginResponse;
  onSaved: (newEmail: string) => void;
  onBack: () => void;
}

export function EditEmailScreen({user, onSaved, onBack}: Props) {
  const [phase, setPhase] = useState<'input' | 'confirm'>('input');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim()) &&
    newEmail.trim() !== user.email;

  const handleRequestChange = async () => {
    setLoading(true);
    setError('');
    try {
      await requestEmailChange(user.token, newEmail.trim());
      setPhase('confirm');
    } catch (e: any) {
      setError(e.message ?? 'Erro ao solicitar alteração.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmChange = async () => {
    setLoading(true);
    setError('');
    try {
      await confirmEmailChange(user.token, newEmail.trim(), code);
      onSaved(newEmail.trim());
    } catch (e: any) {
      setError(e.message ?? 'Código inválido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (phase === 'confirm') {
      setPhase('input');
      setCode('');
      setError('');
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Alterar e-mail" onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {phase === 'input' ? (
          <>
            <View style={styles.form}>
              <Text style={styles.current}>Atual: {user.email}</Text>
              <Input
                label="Novo e-mail"
                value={newEmail}
                onChangeText={t => { setNewEmail(t); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                error={error}
              />
              <Text style={styles.hint}>
                Um código de confirmação será enviado para o novo endereço.
              </Text>
            </View>
            <View style={styles.footer}>
              <Button
                label="Continuar"
                loading={loading}
                onPress={handleRequestChange}
                disabled={!emailValid}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.form}>
              <Text style={styles.instruction}>
                Insira o código de 6 dígitos enviado para{'\n'}
                <Text style={styles.emailHighlight}>{newEmail}</Text>
              </Text>
              <OtpInput value={code} onChange={setCode} error={!!error} testID="code-input" />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
            <View style={styles.footer}>
              <Button
                label="Confirmar alteração"
                loading={loading}
                onPress={handleConfirmChange}
                disabled={code.length !== 6}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  body: {flex: 1},
  form: {padding: 20},
  current: {color: colors.textSecondary, fontSize: 13, marginBottom: 16},
  hint: {color: colors.textMuted, fontSize: 12, marginTop: 8},
  instruction: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  emailHighlight: {color: colors.text, fontWeight: '600'},
  errorText: {color: colors.error, fontSize: 13, marginTop: 14},
  footer: {padding: 20},
});
