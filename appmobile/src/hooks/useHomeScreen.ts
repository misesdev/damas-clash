import {useCallback, useEffect, useState} from 'react';
import {showMessage} from '../components/MessageBox';
import {cancelGame, joinGame, listGames} from '../api/games';
import type {LoginResponse} from '../types/auth';
import type {GameResponse, GameStatus} from '../types/game';

export type FilterTab = Exclude<GameStatus, "Completed">;

export function useHomeScreen(
  user: LoginResponse,
  pendingGame: GameResponse | null | undefined,
  liveGames: GameResponse[] | null | undefined,
  onGameSelect: (game: GameResponse) => void,
  onGameCancelled?: (gameId: string) => void,
) {
  const [fetchedGames, setFetchedGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('WaitingForPlayers');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGames = useCallback(async () => {
    try {
      const data = await listGames(user.token);
      setFetchedGames(data);
      setError('');
    } catch {
      setError('Não foi possível carregar as partidas.');
    }
  }, [user.token]);

  // Initial fetch — used until first real-time update arrives
  useEffect(() => {
    if (liveGames !== null && liveGames !== undefined) {
      // Already have live data, skip initial fetch
      setLoading(false);
      return;
    }
    fetchGames().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When live data arrives for the first time, stop showing loader
  useEffect(() => {
    if (liveGames !== null && liveGames !== undefined) {
      setLoading(false);
    }
  }, [liveGames]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGames();
    setRefreshing(false);
  };

  const handleGamePress = async (game: GameResponse) => {
    const isParticipant =
      game.playerBlackId === user.playerId || game.playerWhiteId === user.playerId;

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
    showMessage({
      title: 'Cancelar partida',
      message: 'Tem certeza que deseja cancelar esta partida?',
      type: 'confirm',
      actions: [
        {label: 'Não'},
        {
          label: 'Cancelar',
          danger: true,
          onPress: async () => {
            setCancellingId(game.id);
            try {
              await cancelGame(user.token, game.id);
              setFetchedGames(prev => prev.filter(g => g.id !== game.id));
              onGameCancelled?.(game.id);
            } catch {
              setError('Não foi possível cancelar a partida.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    });
  };

  // Use live games when available, otherwise fall back to fetched
  const games = liveGames ?? fetchedGames;
  const filteredFromServer = games.filter(g => g.status === activeTab);
  const tabFiltered =
    pendingGame &&
    pendingGame.status === activeTab &&
    !filteredFromServer.some(g => g.id === pendingGame.id)
      ? [pendingGame, ...filteredFromServer]
      : filteredFromServer;

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? tabFiltered.filter(g =>
        g.playerBlackUsername?.toLowerCase().includes(q) ||
        g.playerWhiteUsername?.toLowerCase().includes(q),
      )
    : tabFiltered;

  return {
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
  };
}
