import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {showMessage} from '../components/MessageBox';
import {cancelGame, joinGame, listGames} from '../api/games';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';

export function useHomeScreen(
  user: LoginResponse,
  pendingGame: GameResponse | null | undefined,
  liveGames: GameResponse[] | null | undefined,
  onGameSelect: (game: GameResponse) => void,
  onGameCancelled?: (gameId: string) => void,
) {
  const {t} = useTranslation();
  const [fetchedGames, setFetchedGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGames = useCallback(async () => {
    try {
      const data = await listGames(user.token);
      setFetchedGames(data);
      setError('');
    } catch {
      setError(t('home.errors.loadGames'));
    }
  }, [user.token, t]);

  // Initial fetch — used until first real-time update arrives
  useEffect(() => {
    if (liveGames !== null && liveGames !== undefined) {
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
        setError(t('home.errors.joinGame'));
        setJoiningId(null);
      }
    } else {
      onGameSelect(game);
    }
  };

  const handleCancelGame = (game: GameResponse) => {
    showMessage({
      title: t('home.cancelConfirm.title'),
      message: t('home.cancelConfirm.message'),
      type: 'confirm',
      actions: [
        {label: t('home.cancelConfirm.no')},
        {
          label: t('home.cancelConfirm.cancel'),
          danger: true,
          onPress: async () => {
            setCancellingId(game.id);
            try {
              await cancelGame(user.token, game.id);
              setFetchedGames(prev => prev.filter(g => g.id !== game.id));
              onGameCancelled?.(game.id);
            } catch {
              setError(t('home.errors.cancelGame'));
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

  // Single unified list: all active games (Waiting + InProgress)
  const activeGames = games.filter(
    g => g.status === 'WaitingForPlayers' || g.status === 'InProgress',
  );
  const withPending =
    pendingGame && !activeGames.some(g => g.id === pendingGame.id)
      ? [pendingGame, ...activeGames]
      : activeGames;

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? withPending.filter(
        g =>
          g.playerBlackUsername?.toLowerCase().includes(q) ||
          g.playerWhiteUsername?.toLowerCase().includes(q),
      )
    : withPending;

  return {
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
  };
}
