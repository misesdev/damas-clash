import React from 'react';
import {ActivityIndicator, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {WalletHeader} from '../../components/WalletHeader';
import {SatsInput} from '../../components/SatsInput';
import {useWithdraw} from '../../hooks/useWithdraw';
import {styles} from '../../styles/withdrawStyles';
import type {LoginResponse} from '../../types/auth';
import type {WalletResponse} from '../../types/wallet';
import { ScreenHeader } from '../../components/ScreenHeader';

interface Props {
  user: LoginResponse;
  wallet: WalletResponse | null;
  lightningAddress: string | null;
  onBack: () => void;
  onSuccess: () => void;
  onRegisterLightningAddress: () => void;
}

export function WithdrawScreen({
  user, wallet, lightningAddress,
  onBack, onSuccess, onRegisterLightningAddress,
}: Props) {
  const {t} = useTranslation();
  const {
    amountText, setAmountText,
    loading, error, success, paidAmount,
    available, canWithdraw,
    handleWithdraw,
  } = useWithdraw(user, wallet, onSuccess);

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>⚡</Text>
          <Text style={styles.successTitle}>{t('withdraw.successTitle')}</Text>
          <Text style={styles.successMessage}>
            {t('withdraw.successMessage', {amount: paidAmount.toLocaleString()})}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lightningAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={t('withdraw.title')} onBack={onBack} />
        <WalletHeader
          title={t('withdraw.title')}
          subtitle={t('withdraw.noAddress.hint')}
        />
        <View style={styles.noAddressContainer}>
          <Text style={styles.noAddressTitle}>{t('withdraw.noAddress.title')}</Text>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={onRegisterLightningAddress}
            testID="register-lightning-btn">
            <Text style={styles.registerBtnText}>{t('withdraw.noAddress.registerButton')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScreenHeader title={t('withdraw.title')} onBack={onBack} />
        <WalletHeader
          title={t('withdraw.title')}
          subtitle={t('withdraw.subtitle')}
        />

        <SatsInput
          value={amountText}
          onChange={setAmountText}
          testID="withdraw-amount-display"
        />

        <Text style={styles.addressTag}>⚡ {lightningAddress}</Text>
        <Text style={styles.availableHint}>
          {t('withdraw.availableLabel', {amount: available.toLocaleString()})}
        </Text>

        <View style={styles.footer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.registerBtn, !canWithdraw && styles.withdrawBtnDisabled]}
            onPress={handleWithdraw}
            disabled={!canWithdraw}
            testID="withdraw-submit-btn">
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={[styles.registerBtnText, !canWithdraw && styles.withdrawBtnTextDisabled]}>
                {t('withdraw.withdrawButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
