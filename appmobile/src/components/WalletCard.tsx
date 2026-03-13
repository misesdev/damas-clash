import React from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {styles} from '../styles/walletCardStyles';
import type {WalletResponse} from '../types/wallet';

interface Props {
  wallet: WalletResponse | null;
  loading?: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
  onHistory: () => void;
}

export function WalletCard({wallet, loading, onDeposit, onWithdraw, onHistory}: Props) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('wallet.balance')}</Text>
      <View style={styles.balanceRow}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.amount} testID="wallet-balance">
              {(wallet?.availableBalanceSats ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.unit}>{t('wallet.unit')}</Text>
          </>
        )}
      </View>
      {wallet && wallet.lockedBalanceSats > 0 && (
        <Text style={styles.lockedLabel}>
          {t('wallet.lockedLabel', {amount: wallet.lockedBalanceSats.toLocaleString()})}
        </Text>
      )}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onWithdraw} testID="wallet-withdraw-btn">
          <Text style={styles.btnText}>{t('wallet.withdrawButton')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onDeposit} testID="wallet-deposit-btn">
          <Text style={[styles.btnText, styles.btnTextPrimary]}>{t('wallet.depositButton')}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.historyBtn} onPress={onHistory} testID="wallet-history-btn">
        <Text style={styles.historyBtnText}>{t('wallet.historyButton')}</Text>
      </TouchableOpacity>
    </View>
  );
}
