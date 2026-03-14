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
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ScreenHeader} from '../../components/ScreenHeader';
import {WalletHeader} from '../../components/WalletHeader';
import {QRScannerInput} from '../../components/QRScannerInput';
import {SatsInput} from '../../components/SatsInput';
import {useWithdraw} from '../../hooks/useWithdraw';
import {styles} from '../../styles/withdrawStyles';
import type {LoginResponse} from '../../types/auth';
import type {WalletResponse} from '../../types/wallet';

interface Props {
  user: LoginResponse;
  wallet: WalletResponse | null;
  lightningAddress: string | null;
  onBack: () => void;
  onSuccess: () => void;
  onRegisterLightningAddress: () => void;
}

export function WithdrawScreen({
  user,
  wallet,
  lightningAddress,
  onBack,
  onSuccess,
}: Props) {
  const {t} = useTranslation();
  const {
    amountText,
    setAmountText,
    targetAddress,
    setTargetAddress,
    addressError,
    loading,
    error,
    success,
    paidAmount,
    available,
    canWithdraw,
    handleWithdraw,
  } = useWithdraw(user, wallet, lightningAddress, onSuccess);

  // ─── Success state ──────────────────────────────────────────────────────────

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

  // ─── Main form ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('withdraw.title')} onBack={onBack} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <WalletHeader
            title={t('withdraw.title')}
            subtitle={t('withdraw.subtitle')}
          />

          {/* Destination address — pre-filled with registered address, scannable */}
          <QRScannerInput
            label={t('withdraw.destinationLabel')}
            placeholder={t('withdraw.destinationPlaceholder')}
            value={targetAddress}
            onChangeText={setTargetAddress}
            error={addressError}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            scannerTitle={t('qrScanner.title')}
            testID="withdraw-address-input"
          />

          {/* Amount */}
          <View style={styles.amountSection}>
            {/* <Text style={styles.sectionLabel}>{t('withdraw.availableLabel', {amount: available.toLocaleString()})}</Text> */}
            <SatsInput
              value={amountText}
              onChange={setAmountText}
              testID="withdraw-amount-display"
              available={available}
            />
          </View>
        </ScrollView>

        {/* Sticky footer — stays above keyboard */}
        <View style={styles.footer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.withdrawBtn, !canWithdraw && styles.withdrawBtnDisabled]}
            onPress={handleWithdraw}
            disabled={!canWithdraw}
            testID="withdraw-submit-btn">
            {loading ? (
              <ActivityIndicator color={styles.withdrawBtnText.color} />
            ) : (
              <Text style={styles.withdrawBtnText}>{t('withdraw.withdrawButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
