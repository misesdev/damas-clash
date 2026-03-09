'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showMessage } from '../components/MessageBox';
import { cancelGame, joinGame, listGames } from '../api/games';
import type { LoginResponse } from '../types/auth';
import type { GameResponse, GameStatus } from '../types/game';
import '../i18n';

export type FilterTab = Exclude<GameStatus, 'Completed'>;

export function useHomeScreen(
  user: LoginResponse,
  pendingGame: GameResponse | null | undefined,
  liveGames: GameResponse[] | null | undefined,
  onGameSelect: (game: GameResponse) => void,
  onGameCancelled?: (gameId: string) => void,
) {
  const { t } = useTranslation();
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
      setError(t('home_errorLoad'));
    }
  }, [user.token, t]);

  useEffect(() => {
    if (liveGames !== null && liveGames !== undefined) {
      setLoading(false);
      return;
    }
    fetchGames().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setError(t('home_errorJoin'));
        setJoiningId(null);
      }
    } else {
      onGameSelect(game);
    }
  };

  const handleCancelGame = (game: GameResponse) => {
    showMessage({
      title: t('home_cancelTitle'),
      message: t('home_cancelMessage'),
      type: 'confirm',
      actions: [
        { label: t('home_cancelNo') },
        {
          label: t('home_cancelConfirm'),
          danger: true,
          onPress: async () => {
            setCancellingId(game.id);
            try {
              await cancelGame(user.token, game.id);
              setFetchedGames(prev => prev.filter(g => g.id !== game.id));
              onGameCancelled?.(game.id);
            } catch {
              setError(t('home_cancelError'));
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    });
  };

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
