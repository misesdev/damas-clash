import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ScreenHeader} from '../../components/ScreenHeader';
import {getTransactions} from '../../api/wallet';
import {colors} from '../../theme/colors';
import type {LoginResponse} from '../../types/auth';
import type {LedgerEntryResponse} from '../../types/wallet';

interface Props {
  user: LoginResponse;
  onBack: () => void;
}

const POSITIVE_TYPES = ['deposit', 'gamewin', 'refund'];

function TxRow({entry}: {entry: LedgerEntryResponse}) {
  const {t} = useTranslation();

  const typeKey = entry.type.toLowerCase();
  const labelMap: Record<string, string> = {
    deposit: t('walletHistory.types.deposit'),
    withdraw: t('walletHistory.types.withdraw'),
    bet: t('walletHistory.types.bet'),
    win: t('walletHistory.types.win'),
    refund: t('walletHistory.types.refund'),
  };
  const label = labelMap[typeKey] ?? entry.type;
  const isPositive = POSITIVE_TYPES.includes(typeKey);
  const date = new Date(entry.createdAt).toLocaleDateString();

  return (
    <View style={styles.row}>
      <View style={[styles.iconBadge, isPositive ? styles.iconBadgePos : styles.iconBadgeNeg]}>
        <Text style={styles.iconText}>{isPositive ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDate}>{date}</Text>
      </View>
      <Text style={[styles.rowAmount, isPositive ? styles.amountPos : styles.amountNeg]}>
        {isPositive ? '+' : '-'}{Math.abs(entry.amountSats).toLocaleString()} sats
      </Text>
    </View>
  );
}

export function WalletHistoryScreen({user, onBack}: Props) {
  const {t} = useTranslation();
  const [transactions, setTransactions] = useState<LedgerEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransactions(user.token);
      setTransactions(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('walletHistory.title')} onBack={onBack} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('walletHistory.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({item}) => <TxRow entry={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBadgePos: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  iconBadgeNeg: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  amountPos: {
    color: '#4CAF50',
  },
  amountNeg: {
    color: colors.error,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
