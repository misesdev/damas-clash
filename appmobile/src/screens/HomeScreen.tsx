import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {GameCard} from '../components/GameCard';
import {useHomeScreen} from '../hooks/useHomeScreen';
import {styles} from '../styles/homeStyles';
import type {LoginResponse} from '../types/auth';
import type {GameResponse, GameStatus} from '../types/game';
import {colors} from '../theme/colors';

interface Props {
  user: LoginResponse;
  pendingGame?: GameResponse | null;
  liveGames?: GameResponse[] | null;
  onGameSelect: (game: GameResponse) => void;
  onGameCancelled?: (gameId: string) => void;
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

export function HomeScreen({user, pendingGame, liveGames, onGameSelect, onGameCancelled}: Props) {
  const {
    loading,
    refreshing,
    joiningId,
    cancellingId,
    error,
    activeTab,
    setActiveTab,
    filtered,
    handleRefresh,
    handleGamePress,
    handleCancelGame,
  } = useHomeScreen(user, pendingGame, liveGames, onGameSelect, onGameCancelled);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {' '}
          <Text style={styles.username}>{user.username}</Text>
        </Text>
      </View>

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
            <Text style={styles.empty}>{EMPTY_MESSAGES[activeTab]}</Text>
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
