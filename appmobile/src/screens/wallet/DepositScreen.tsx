import React from 'react';
import {ActivityIndicator, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import {useTranslation} from 'react-i18next';
import {ScreenHeader} from '../../components/ScreenHeader';
import {SatsInput} from '../../components/SatsInput';
import {useDeposit} from '../../hooks/useDeposit';
import {styles} from '../../styles/depositStyles';
import type {LoginResponse} from '../../types/auth';

interface Props {
  user: LoginResponse;
  onBack: () => void;
  onSuccess: () => void;
}

export function DepositScreen({user, onBack, onSuccess}: Props) {
  const {t} = useTranslation();
  const {
    step,
    amountText, setAmountText,
    loading, error, deposit, copied, creditedAmount,
    handleSubmitAmount, handleCopy,
  } = useDeposit(user, onSuccess);

  if (step === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>⚡</Text>
          <Text style={styles.successTitle}>{t('deposit.successTitle')}</Text>
          <Text style={styles.successMessage}>
            {t('deposit.successMessage', {amount: creditedAmount.toLocaleString()})}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'invoice' && deposit) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={t('deposit.title')} onBack={onBack} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>{t('deposit.invoiceTitle')}</Text>
          <Text style={styles.subtitle}>{t('deposit.invoiceHint')}</Text>

          <View style={styles.qrContainer}>
            <QRCode value={deposit.invoice} size={200} />
          </View>

          <View style={styles.invoiceBox}>
            <Text style={styles.invoiceText} numberOfLines={4}>{deposit.invoice}</Text>
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} testID="copy-invoice-btn">
            <Text style={styles.copyBtnText}>
              {copied ? t('deposit.copiedButton') : t('deposit.copyButton')}
            </Text>
          </TouchableOpacity>

          <View style={styles.waitingRow}>
            <ActivityIndicator color="#888" size="small" />
            <Text style={styles.waitingText}>{t('deposit.waitingPayment')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('deposit.title')} onBack={onBack} />

      <SatsInput
        value={amountText}
        onChange={setAmountText}
      />

      <View style={styles.footer}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.copyBtn}
          onPress={handleSubmitAmount}
          disabled={loading}
          testID="deposit-submit-btn">
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.copyBtnText}>{t('deposit.continueButton')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
