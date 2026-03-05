import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {createGame, joinGame, listGames} from '../api/games';
import {GameCard} from '../components/GameCard';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';

interface Props {
  user: LoginResponse;
  onGameSelect: (game: GameResponse) => void;
  onNewGame: (game: GameResponse) => void;
}

export function HomeScreen({user, onGameSelect, onNewGame}: Props) {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchGames = useCallback(async () => {
    try {
      const data = await listGames(user.token);
      setGames(data.filter(g => g.status !== 'Completed'));
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

  return (
    <SafeAreaView style={styles.container}>
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text}
            />
          }
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {games.length > 0 ? 'Partidas ativas' : 'Nenhuma partida ativa'}
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Crie uma nova partida ou aguarde outros jogadores entrarem.
            </Text>
          }
          renderItem={({item}) => (
            <GameCard
              game={item}
              currentPlayerId={user.playerId}
              loading={joiningId === item.id}
              onPress={() => handleGamePress(item)}
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
  loadingArea: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  list: {paddingHorizontal: 20, paddingBottom: 20},
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 4,
    marginLeft: 4,
  },
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
