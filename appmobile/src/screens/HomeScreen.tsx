import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BoardMark} from '../components/BoardMark';
import {GameCard} from '../components/GameCard';
import {useHomeScreen} from '../hooks/useHomeScreen';
import {styles} from '../styles/homeStyles';
import {getTransactions} from '../api/wallet';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';
import type {LedgerEntryResponse, WalletResponse} from '../types/wallet';

// ─── Types ───────────────────────────────────────────────────────────────────

type HomeTab = 'wallet' | 'games';

interface Props {
  user: LoginResponse;
  pendingGame?: GameResponse | null;
  liveGames?: GameResponse[] | null;
  onlineCount?: number | null;
  wallet: WalletResponse | null;
  walletLoading?: boolean;
  onGameSelect: (game: GameResponse) => void;
  onGameCancelled?: (gameId: string) => void;
  onOpenOnlinePlayers?: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onOpenDashboard?: () => void;
  onOpenChat?: () => void;
}

// ─── Transaction row ─────────────────────────────────────────────────────────

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
    <View style={styles.txRow}>
      <View style={[styles.txIcon, isPositive ? styles.txIconPos : styles.txIconNeg]}>
        <Text style={styles.txIconText}>{isPositive ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{label}</Text>
        <Text style={styles.txDate}>{date}</Text>
      </View>
      <Text style={[styles.txAmount, isPositive ? styles.txAmountPos : styles.txAmountNeg]}>
        {isPositive ? '+' : '-'}{Math.abs(entry.amountSats).toLocaleString()} sats
      </Text>
    </View>
  );
}

// ─── Segment control ─────────────────────────────────────────────────────────

interface SegmentTabsProps {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
}

function SegmentTabs({active, onChange}: SegmentTabsProps) {
  const {t} = useTranslation();
  return (
    <View style={styles.segment}>
      <TouchableOpacity
        style={[styles.segmentTab, active === 'wallet' && styles.segmentTabActive]}
        onPress={() => onChange('wallet')}
        testID="segment-wallet">
        <Text style={[styles.segmentLabel, active === 'wallet' && styles.segmentLabelActive]}>
          {t('home.walletTab')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segmentTab, active === 'games' && styles.segmentTabActive]}
        onPress={() => onChange('games')}
        testID="segment-games">
        <Text style={[styles.segmentLabel, active === 'games' && styles.segmentLabelActive]}>
          {t('home.gamesTab')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Wallet tab ──────────────────────────────────────────────────────────────

interface WalletTabProps {
  user: LoginResponse;
  wallet: WalletResponse | null;
  walletLoading?: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
}

function WalletTab({user, wallet, walletLoading, onDeposit, onWithdraw}: WalletTabProps) {
  const {t} = useTranslation();
  const [transactions, setTransactions] = useState<LedgerEntryResponse[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    getTransactions(user.token)
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, [user.token]);

  return (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.walletScroll}>

      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('wallet.balance')}</Text>
        {walletLoading ? (
          <ActivityIndicator color={colors.text} style={styles.balanceLoader} />
        ) : (
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount} testID="wallet-balance">
              {(wallet?.availableBalanceSats ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.balanceUnit}>{t('wallet.unit')}</Text>
          </View>
        )}
        {wallet && wallet.lockedBalanceSats > 0 && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>
              {t('wallet.lockedLabel', {amount: wallet.lockedBalanceSats.toLocaleString()})}
            </Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onWithdraw}
          testID="wallet-withdraw-btn">
          <Text style={styles.actionIcon}>↑</Text>
          <Text style={styles.actionLabel}>{t('wallet.withdrawButton')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={onDeposit}
          testID="wallet-deposit-btn">
          <Text style={[styles.actionIcon, styles.actionIconPrimary]}>↓</Text>
          <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>
            {t('wallet.depositButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions section */}
      <View style={styles.txSectionHeader}>
        <Text style={styles.txSectionTitle}>{t('home.transactions')}</Text>
      </View>

      {txLoading ? (
        <View style={styles.txCenter}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.txCenter}>
          <Text style={styles.txEmpty}>{t('walletHistory.empty')}</Text>
        </View>
      ) : (
        <View style={styles.txList}>
          {transactions.map((tx, i) => (
            <React.Fragment key={tx.id}>
              <TxRow entry={tx} />
              {i < transactions.length - 1 && <View style={styles.txDivider} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Games tab ───────────────────────────────────────────────────────────────

interface GamesTabProps {
  user: LoginResponse;
  pendingGame?: GameResponse | null;
  liveGames?: GameResponse[] | null;
  onGameSelect: (game: GameResponse) => void;
  onGameCancelled?: (gameId: string) => void;
}

function GamesTab({user, pendingGame, liveGames, onGameSelect, onGameCancelled}: GamesTabProps) {
  const {t} = useTranslation();
  const {
    loading,
    refreshing,
    joiningId,
    cancellingId,
    error,
    searchQuery,
    setSearchQuery,
    filtered,
    handleRefresh,
    handleGamePress,
    handleCancelGame,
  } = useHomeScreen(user, pendingGame, liveGames, onGameSelect, onGameCancelled);

  return (
    <View style={styles.tabContent}>
      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          testID="search-input"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} testID="search-clear">
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.gamesError}>{error}</Text> : null}

      {loading ? (
        <View style={styles.gamesCenter}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <GameCard
              game={item}
              currentPlayerId={user.playerId}
              loading={joiningId === item.id}
              cancelling={cancellingId === item.id}
              onPress={() => handleGamePress(item)}
              onCancel={() => handleCancelGame(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text}
            />
          }
          ListEmptyComponent={
            <Text style={styles.gamesEmpty}>
              {searchQuery.trim() ? t('home.emptySearch') : t('home.emptyGames')}
            </Text>
          }
          contentContainerStyle={styles.gamesList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Live Chat FAB ───────────────────────────────────────────────────────────

function LiveChatFab({onPress}: {onPress: () => void}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1.9, duration: 900, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 1, duration: 900, useNativeDriver: true}),
      ]),
    ).start();
  }, [pulse]);

  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} testID="chat-btn" activeOpacity={0.85}>
      <View style={styles.fabLiveSection}>
        <View style={styles.fabLiveDotWrapper}>
          <Animated.View style={[styles.fabLiveDotRing, {transform: [{scale: pulse}]}]} />
          <View style={styles.fabLiveDot} />
        </View>
        <Text style={styles.fabLiveLabel}>LIVE</Text>
      </View>
      <View style={styles.fabDivider} />
      <Text style={styles.fabChatText}>Chat</Text>
    </TouchableOpacity>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HomeScreen({
  user,
  pendingGame,
  liveGames,
  onlineCount,
  wallet,
  walletLoading,
  onGameSelect,
  onGameCancelled,
  onOpenOnlinePlayers,
  onDeposit,
  onWithdraw,
  onOpenDashboard,
  onOpenChat,
}: Props) {
  const [homeTab, setHomeTab] = useState<HomeTab>('wallet');
  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLogo}>
          <BoardMark size={26} />
          <Text style={styles.topBarTitle}>DAMAS CLASH</Text>
        </View>
        <View style={styles.topBarRight}>
          {user.role === 'Admin' && onOpenDashboard && (
            <TouchableOpacity
              style={styles.adminPill}
              onPress={onOpenDashboard}
              testID="dashboard-btn">
              <Text style={styles.adminText}>⚙ Admin</Text>
            </TouchableOpacity>
          )}
          {onlineCount != null && (
            <TouchableOpacity
              style={styles.onlinePill}
              onPress={onOpenOnlinePlayers}
              testID="online-pill">
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>online</Text>
              <Text style={styles.onlineText}>{onlineCount}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Segment tabs */}
      <SegmentTabs active={homeTab} onChange={setHomeTab} />

      {/* Content */}
      {homeTab === 'wallet' ? (
        <WalletTab
          user={user}
          wallet={wallet}
          walletLoading={walletLoading}
          onDeposit={onDeposit}
          onWithdraw={onWithdraw}
        />
      ) : (
        <GamesTab
          user={user}
          pendingGame={pendingGame}
          liveGames={liveGames}
          onGameSelect={onGameSelect}
          onGameCancelled={onGameCancelled}
        />
      )}

      {/* Live Chat FAB */}
      {onOpenChat && <LiveChatFab onPress={onOpenChat} />}
    </SafeAreaView>
  );
}
