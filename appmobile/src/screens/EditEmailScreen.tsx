import React from 'react';
import {KeyboardAvoidingView, Platform, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {OtpInput} from '../components/OtpInput';
import {ScreenHeader} from '../components/ScreenHeader';
import {useEditEmail} from '../hooks/useEditEmail';
import {styles} from '../styles/editEmailStyles';
import type {LoginResponse} from '../types/auth';

interface Props {
  user: LoginResponse;
  onSaved: (newEmail: string) => void;
  onBack: () => void;
}

export function EditEmailScreen({user, onSaved, onBack}: Props) {
  const {t} = useTranslation();
  const {
    phase,
    newEmail,
    setNewEmail,
    code,
    setCode,
    loading,
    error,
    emailValid,
    handleRequestChange,
    handleConfirmChange,
    handleBack,
  } = useEditEmail(user, onSaved, onBack);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('editEmail.title')} onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {phase === 'input' ? (
          <>
            <View style={styles.form}>
              <Text style={styles.current}>{t('editEmail.currentEmail', {email: user.email})}</Text>
              <Input
                label={t('editEmail.newEmailLabel')}
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                error={error}
              />
              <Text style={styles.hint}>
                {t('editEmail.hint')}
              </Text>
            </View>
            <View style={styles.footer}>
              <Button
                label={t('editEmail.continueButton')}
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
                {t('editEmail.codeInstruction')}{'\n'}
                <Text style={styles.emailHighlight}>{newEmail}</Text>
              </Text>
              <OtpInput value={code} onChange={setCode} error={!!error} testID="code-input" />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
            <View style={styles.footer}>
              <Button
                label={t('editEmail.confirmButton')}
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
