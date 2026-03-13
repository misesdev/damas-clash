import React from 'react';
import {
  ActivityIndicator,
  //Image,
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
import {WalletCard} from '../components/WalletCard';
import {useHomeScreen} from '../hooks/useHomeScreen';
import {styles} from '../styles/homeStyles';
import type {LoginResponse} from '../types/auth';
import type {GameResponse, GameStatus} from '../types/game';
import type {WalletResponse} from '../types/wallet';
import {colors} from '../theme/colors';

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
  onWalletHistory: () => void;
  onOpenDashboard?: () => void;
}

type FilterTab = Exclude<GameStatus, 'Completed'>;

export function HomeScreen({
  user, pendingGame, liveGames, onlineCount,
  wallet, walletLoading,
  onGameSelect, onGameCancelled, onOpenOnlinePlayers,
  onDeposit, onWithdraw, onWalletHistory, onOpenDashboard,
}: Props) {
  const {t} = useTranslation();

  const TABS: {key: FilterTab; label: string}[] = [
    {key: 'WaitingForPlayers', label: t('home.waitingTab')},
    {key: 'InProgress', label: t('home.inProgressTab')},
  ];

  const EMPTY_MESSAGES: Record<FilterTab, string> = {
    WaitingForPlayers: t('home.emptyWaiting'),
    InProgress: t('home.emptyInProgress'),
  };

  const {
    loading,
    refreshing,
    joiningId,
    cancellingId,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filtered,
    handleRefresh,
    handleGamePress,
    handleCancelGame,
  } = useHomeScreen(user, pendingGame, liveGames, onGameSelect, onGameCancelled);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar (fixed) */}
      <View style={styles.topBar}>
        <View style={styles.topBarLogo}>
          <BoardMark size={26} />
          <Text style={styles.topBarTitle}>DAMAS CLASH</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          {user.role === 'Admin' && onOpenDashboard && (
            <TouchableOpacity
              style={styles.dashboardPill}
              onPress={onOpenDashboard}
              testID="dashboard-btn">
              <Text style={styles.dashboardText}>⚙ Admin</Text>
            </TouchableOpacity>
          )}
          {onlineCount != null && (
            <TouchableOpacity
              style={styles.onlinePill}
              onPress={onOpenOnlinePlayers}
              testID="online-pill">
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{t('home.onlineCount', {count: onlineCount})}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
          />
        }
        showsVerticalScrollIndicator={false}>

        {/* Index 0: WalletCard — scrolls away */}
        <WalletCard
          wallet={wallet}
          loading={walletLoading}
          onDeposit={onDeposit}
          onWithdraw={onWithdraw}
          onHistory={onWalletHistory}
        />

        {/* Index 1: Tabs + Search — becomes sticky */}
        <View style={styles.stickyHeader}>
          <View style={styles.tabs}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                testID={`tab-filter-${tab.key}`}>
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor="#4E4E4E"
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
        </View>

        {/* Index 2: Game list */}
        <View style={styles.list}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : filtered.length === 0 ? (
            <Text style={styles.empty}>
              {searchQuery.trim() ? t('home.emptySearch') : EMPTY_MESSAGES[activeTab]}
            </Text>
          ) : (
            filtered.map(item => (
              <GameCard
                key={item.id}
                game={item}
                currentPlayerId={user.playerId}
                loading={joiningId === item.id}
                cancelling={cancellingId === item.id}
                onPress={() => handleGamePress(item)}
                onCancel={() => handleCancelGame(item)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
