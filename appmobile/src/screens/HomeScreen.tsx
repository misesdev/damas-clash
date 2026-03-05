import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {cancelGame, createGame, joinGame, listGames} from '../api/games';
import {GameCard} from '../components/GameCard';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';
import type {GameResponse, GameStatus} from '../types/game';

interface Props {
  user: LoginResponse;
  onGameSelect: (game: GameResponse) => void;
  onNewGame: (game: GameResponse) => void;
  onGameCancelled?: (gameId: string) => void;
}

type FilterTab = GameStatus;

const TABS: {key: FilterTab; label: string}[] = [
  {key: 'WaitingForPlayers', label: 'Aguardando'},
  {key: 'InProgress', label: 'Em andamento'},
  {key: 'Completed', label: 'Finalizadas'},
];

const EMPTY_MESSAGES: Record<FilterTab, string> = {
  WaitingForPlayers: 'Nenhuma partida aguardando jogadores.',
  InProgress: 'Nenhuma partida em andamento.',
  Completed: 'Nenhuma partida finalizada.',
};

export function HomeScreen({user, onGameSelect, onNewGame, onGameCancelled}: Props) {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('WaitingForPlayers');

  const fetchGames = useCallback(async () => {
    try {
      const data = await listGames(user.token);
      setGames(data);
      setError('');
    } catch {
      setError('Não foi possível carregar as partidas.');
    }
  }, [user.token]);

  useEffect(() => {
    fetchGames().finally(() => setLoading(false));
  }, [fetchGames]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGames();
    setRefreshing(false);
  };

  const handleNewGame = async () => {
    setCreating(true);
    setError('');
    try {
      const game = await createGame(user.token);
      onNewGame(game);
    } catch {
      setError('Não foi possível criar a partida.');
      setCreating(false);
    }
  };

  const handleGamePress = async (game: GameResponse) => {
    const isParticipant =
      game.playerBlackId === user.playerId ||
      game.playerWhiteId === user.playerId;

    if (game.status === 'WaitingForPlayers' && !isParticipant) {
      setJoiningId(game.id);
      try {
        const updated = await joinGame(user.token, game.id);
        onGameSelect(updated);
      } catch {
        setError('Não foi possível entrar na partida.');
        setJoiningId(null);
      }
    } else {
      onGameSelect(game);
    }
  };

  const handleCancelGame = (game: GameResponse) => {
    Alert.alert(
      'Cancelar partida',
      'Tem certeza que deseja cancelar esta partida?',
      [
        {text: 'Não', style: 'cancel'},
        {
          text: 'Cancelar partida',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(game.id);
            try {
              await cancelGame(user.token, game.id);
              setGames(prev => prev.filter(g => g.id !== game.id));
              onGameCancelled?.(game.id);
            } catch {
              setError('Não foi possível cancelar a partida.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  const filtered = games.filter(g => g.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.username}>{user.username}</Text>
        </View>
        <TouchableOpacity
          style={styles.newGameBtn}
          onPress={handleNewGame}
          disabled={creating}
          testID="new-game-button">
          {creating ? (
            <ActivityIndicator color={colors.primaryText} size="small" />
          ) : (
            <Text style={styles.newGameText}>+ Nova partida</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
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

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {color: colors.textSecondary, fontSize: 13},
  username: {color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3},
  newGameBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 48,
    alignItems: 'center',
  },
  newGameText: {color: colors.primaryText, fontWeight: '600', fontSize: 14},

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primaryText,
    fontWeight: '600',
  },

  loadingArea: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  list: {paddingHorizontal: 20, paddingBottom: 20},
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 48,
    lineHeight: 22,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
});
