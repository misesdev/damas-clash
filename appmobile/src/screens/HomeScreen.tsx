import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {BoardMark} from '../components/BoardMark';
import {GameCard} from '../components/GameCard';
import {useHomeScreen} from '../hooks/useHomeScreen';
import {styles} from '../styles/homeStyles';
import type {LoginResponse} from '../types/auth';
import type {GameResponse, GameStatus} from '../types/game';
import {colors} from '../theme/colors';
import { Icon } from '../components/Icon';

interface Props {
  user: LoginResponse;
  pendingGame?: GameResponse | null;
  liveGames?: GameResponse[] | null;
  onlineCount?: number | null;
  onGameSelect: (game: GameResponse) => void;
  onGameCancelled?: (gameId: string) => void;
  onOpenOnlinePlayers?: () => void;
}

type FilterTab = Exclude<GameStatus, 'Completed'>;

const TABS: {key: FilterTab; label: string}[] = [
  {key: 'WaitingForPlayers', label: 'Aguardando'},
  {key: 'InProgress', label: 'Em andamento'},
  //{key: 'Completed', label: 'Finalizadas'},
];

const EMPTY_MESSAGES: Record<FilterTab, string> = {
  WaitingForPlayers: 'Nenhuma partida aguardando jogadores.',
  InProgress: 'Nenhuma partida em andamento.',
  //Completed: 'Nenhuma partida finalizada.',
};

export function HomeScreen({user, pendingGame, liveGames, onlineCount, onGameSelect, onGameCancelled, onOpenOnlinePlayers}: Props) {
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

  const initials = user.username ? user.username.slice(0, 2).toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLogo}>
          <BoardMark size={26} />
          <Text style={styles.topBarTitle}>DAMAS CLASH</Text>
        </View>
        {onlineCount != null && (
          <TouchableOpacity
            style={styles.onlinePill}
            onPress={onOpenOnlinePlayers}
            testID="online-pill">
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{onlineCount} online</Text>
          </TouchableOpacity>
        )}
        <View style={styles.topBarAvatar}>
          {user.avatarUrl ? (
            <Image source={{uri: user.avatarUrl}} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Section heading */}
      {/* <View style={styles.sectionHeading}> */}
      {/*   <Text style={styles.sectionTitle}>Partidas</Text> */}
      {/* </View> */}
      <View style={{ height: 15 }} />

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

      {/* Search field */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar jogador..."
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchQuery.trim()
                ? 'Nenhuma partida encontrada para esta busca.'
                : EMPTY_MESSAGES[activeTab]}
            </Text>
          }
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
        />
      )}
    </SafeAreaView>
  );
}
