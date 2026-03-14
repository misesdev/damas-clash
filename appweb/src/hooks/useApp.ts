'use client';

import {
  HubConnectionBuilder,
  HttpTransportType,
  HubConnectionState,
} from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { useEffect, useRef, useState } from 'react';
import { showMessage } from '../components/MessageBox';
import { cancelGame, createGame, getGame } from '../api/games';
import { refreshAccessToken } from '../api/auth';
import { getWallet } from '../api/wallet';
import { getPlayer } from '../api/players';
import { BASE_URL } from '../api/client';
import { clearActiveGameId, clearSession, loadActiveGameId, loadSession, saveActiveGameId, saveSession } from '../utils/session';
import type { LoginResponse } from '../types/auth';
import type { GameResponse } from '../types/game';
import type { OnlinePlayerInfo } from '../types/player';
import i18n from '../i18n';

type Screen = 'landing' | 'login' | 'register' | 'confirmEmail' | 'verifyLogin' | 'nostrLogin';
type AuthScreen = 'tabs' | 'waitingRoom' | 'checkersBoard' | 'editUsername' | 'editEmail' | 'gameHistory' | 'replay' | 'wallet' | 'editLightningAddress' | 'playerProfile' | 'dashboard' | 'chat';

interface SelectedPlayer {
  playerId: string;
  username: string;
  avatarUrl?: string | null;
}
type TabName = 'home' | 'profile';

const REFRESH_BUFFER_MS = 2 * 60 * 1000;

export function useApp() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('tabs');
  const [tab, setTab] = useState<TabName>('home');
  const [pendingEmail, setPendingEmail] = useState('');
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameResponse | null>(null);
  const [replayGame, setReplayGame] = useState<GameResponse | null>(null);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingGame, setCreatingGame] = useState(false);
  const [liveGames, setLiveGames] = useState<GameResponse[] | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayerInfo[]>([]);
  const [showOnlinePlayers, setShowOnlinePlayers] = useState(false);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<SelectedPlayer | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [lightningAddress, setLightningAddress] = useState<string | null>(null);
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  const authScreenRef = useRef<AuthScreen>('tabs');
  useEffect(() => { authScreenRef.current = authScreen; }, [authScreen]);

  const pendingGameIdRef = useRef<string | null>(null);
  const hubRef = useRef<HubConnection | null>(null);

  // Load persisted session + active game
  useEffect(() => {
    const saved = loadSession();
    if (!saved) { setLoading(false); return; }
    setSession(saved);
    const gameId = loadActiveGameId();
    if (!gameId) { setLoading(false); return; }
    getGame(saved.token, gameId)
      .then(activeGame => {
        if (activeGame.status === 'InProgress') {
          setSelectedGame(activeGame);
          setAuthScreen('checkersBoard');
        } else {
          clearActiveGameId();
        }
      })
      .catch(() => clearActiveGameId())
      .finally(() => setLoading(false));
  }, []);

  // Proactive token refresh
  useEffect(() => {
    if (!session?.refreshToken || !session?.expiresAt) return;

    const expiryMs = new Date(session.expiresAt).getTime();
    const delay = Math.max(0, expiryMs - Date.now() - REFRESH_BUFFER_MS);

    const timer = setTimeout(async () => {
      try {
        const renewed = await refreshAccessToken(session.refreshToken);
        const updated = { ...session, ...renewed };
        saveSession(updated);
        setSession(updated);
      } catch {
        handleLogout();
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  // Fetch wallet balance when session changes
  useEffect(() => {
    if (!session?.token) { setWalletBalance(null); return; }
    getWallet(session.token)
      .then(w => setWalletBalance(w.availableBalanceSats))
      .catch(() => setWalletBalance(null));
  }, [session?.token]);

  // Fetch lightning address when session changes
  useEffect(() => {
    if (!session?.token || !session?.playerId) { setLightningAddress(null); return; }
    getPlayer(session.token, session.playerId)
      .then(p => setLightningAddress(p.lightningAddress))
      .catch(() => setLightningAddress(null));
  }, [session?.token]);

  // Persistent SignalR connection
  useEffect(() => {
    if (!session) return;

    let hub: HubConnection;
    let active = true;

    (async () => {
      try {
        hub = new HubConnectionBuilder()
          .withUrl(`${BASE_URL}/hubs/game`, {
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true,
            accessTokenFactory: () => session.token,
          })
          .withAutomaticReconnect()
          .build();

        hub.on('GameListUpdated', (games: GameResponse[]) => {
          if (!active) return;
          setLiveGames(games);
        });

        hub.on('OnlinePlayersUpdated', (players: OnlinePlayerInfo[]) => {
          if (!active || !Array.isArray(players)) return;
          setOnlinePlayers(players);
        });

        hub.on('GameStarted', (game: GameResponse) => {
          if (!active) return;
          setPendingGameId(null);
          setShowOnlinePlayers(false);
          saveActiveGameId(game.id);

          if (authScreenRef.current === 'waitingRoom') {
            setSelectedGame(game);
            setAuthScreen('checkersBoard');
          } else {
            showMessage({
              title: i18n.t('app_opponentFoundTitle'),
              message: i18n.t('app_opponentFoundMsg'),
              type: 'confirm',
              actions: [
                { label: i18n.t('app_playLater') },
                {
                  label: i18n.t('app_playNow'),
                  primary: true,
                  onPress: () => {
                    setSelectedGame(game);
                    setAuthScreen('checkersBoard');
                  },
                },
              ],
            });
          }
        });

        hub.onreconnected(async () => {
          if (!active) return;
          try {
            await hub.invoke('JoinLobby');
            if (pendingGameIdRef.current) {
              await hub.invoke('WatchGame', pendingGameIdRef.current);
            }
          } catch { /* silently ignore */ }
        });

        await hub.start();
        if (!active) { hub.stop(); return; }

        hubRef.current = hub;
        await hub.invoke('JoinLobby');

        if (pendingGameIdRef.current) {
          await hub.invoke('WatchGame', pendingGameIdRef.current);
        }
      } catch {
        // Silently ignore
      }
    })();

    return () => {
      active = false;
      hubRef.current = null;
      hub?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  // Watch game when pendingGameId changes
  useEffect(() => {
    pendingGameIdRef.current = pendingGameId;
    const hub = hubRef.current;
    if (!hub || hub.state !== HubConnectionState.Connected) return;
    if (pendingGameId) {
      hub.invoke('WatchGame', pendingGameId).catch(() => {});
    }
  }, [pendingGameId]);

  const handleLogin = (data: LoginResponse) => {
    saveSession(data);
    setSession(data);
    setAuthScreen('tabs');
    setTab('home');
  };

  const handleLogout = () => {
    clearSession();
    clearActiveGameId();
    setSession(null);
    setScreen('login');
    setAuthScreen('tabs');
    setPendingGameId(null);
    setLiveGames(null);
    setOnlinePlayers([]);
    setShowOnlinePlayers(false);
    setSelectedPlayerProfile(null);
  };

  const handleViewPlayerProfile = (playerId: string, username: string, avatarUrl?: string | null) => {
    setSelectedPlayerProfile({ playerId, username, avatarUrl });
    setShowOnlinePlayers(false);
    setAuthScreen('playerProfile');
  };

  const handleBackFromPlayerProfile = () => {
    setSelectedPlayerProfile(null);
    setAuthScreen('tabs');
  };

  const handleWatchOnlineGame = async (gameId: string) => {
    if (!session) return;
    setShowOnlinePlayers(false);
    try {
      const game = await getGame(session.token, gameId);
      handleGameSelect(game);
    } catch {
      // silently ignore
    }
  };

  const handleNewGame = () => {
    if (!session || creatingGame) return;
    const existingGame = liveGames?.find(
      g => g.playerBlackId === session.playerId && g.status === 'WaitingForPlayers',
    );
    if (existingGame) {
      setSelectedGame(existingGame);
      setPendingGameId(existingGame.id);
      setAuthScreen('waitingRoom');
      return;
    }
    setShowNewGameModal(true);
  };

  const handleCreateGame = async (betAmountSats: number) => {
    if (!session || creatingGame) return;
    setCreatingGame(true);
    try {
      const game = await createGame(session.token, betAmountSats);
      setShowNewGameModal(false);
      setSelectedGame(game);
      setPendingGameId(game.id);
      setAuthScreen('waitingRoom');
    } catch {
      // silently ignore
    } finally {
      setCreatingGame(false);
    }
  };

  const handleCancelWaitingRoom = async () => {
    if (!session || !selectedGame) return;
    await cancelGame(session.token, selectedGame.id);
    setSelectedGame(null);
    setAuthScreen('tabs');
    setTab('home');
  };

  const handleWaitingRoomBack = () => {
    setAuthScreen('tabs');
    setTab('home');
  };

  const handleGameSelect = (game: GameResponse) => {
    setSelectedGame(game);
    setAuthScreen('checkersBoard');
    const isPlayer = game.playerBlackId === session?.playerId || game.playerWhiteId === session?.playerId;
    if (isPlayer && game.status === 'InProgress') saveActiveGameId(game.id);
  };

  const handleBackFromBoard = () => {
    clearActiveGameId();
    setAuthScreen('tabs');
    setSelectedGame(null);
  };

  const handleOpenWallet = () => setAuthScreen('wallet');
  const handleBackFromWallet = () => { setAuthScreen('tabs'); setTab('profile'); };
  const handleOpenEditLightningAddress = () => setAuthScreen('editLightningAddress');
  const handleBackFromLightningAddress = () => setAuthScreen('wallet');
  const handleLightningAddressSaved = (addr: string | null) => {
    setLightningAddress(addr);
    setAuthScreen('wallet');
  };
  const handleOpenDashboard = () => setAuthScreen('dashboard');
  const handleBackFromDashboard = () => { setAuthScreen('tabs'); setTab('home'); };

  const handleOpenChat = () => setAuthScreen('chat');
  const handleCloseChat = () => setAuthScreen('tabs');
  const handleNavigateToEditUsername = () => setAuthScreen('editUsername');
  const handleNavigateToEditEmail = () => setAuthScreen('editEmail');
  const handleNavigateToNostr = () => setScreen('nostrLogin');
  const handleBackFromNostr = () => setScreen('login');

  const handleOpenHistory = () => setAuthScreen('gameHistory');
  const handleBackFromHistory = () => { setAuthScreen('tabs'); setTab('profile'); };
  const handleOpenReplay = (game: GameResponse) => { setReplayGame(game); setAuthScreen('replay'); };
  const handleBackFromReplay = () => setAuthScreen('gameHistory');

  const handleBackToProfile = () => {
    setAuthScreen('tabs');
    setTab('profile');
  };

  const updateSession = (updates: Partial<LoginResponse>) => {
    if (!session) return;
    const updated = { ...session, ...updates };
    saveSession(updated);
    setSession(updated);
  };

  return {
    screen,
    setScreen,
    authScreen,
    tab,
    setTab,
    pendingEmail,
    setPendingEmail,
    session,
    loading,
    handleLogin,
    handleLogout,
    updateSession,
    selectedGame,
    pendingGameId,
    setPendingGameId,
    creatingGame,
    liveGames,
    onlinePlayers,
    onlineCount: onlinePlayers.length || null,
    showOnlinePlayers,
    setShowOnlinePlayers,
    selectedPlayerProfile,
    handleViewPlayerProfile,
    handleBackFromPlayerProfile,
    handleWatchOnlineGame,
    handleNewGame,
    handleCancelWaitingRoom,
    handleWaitingRoomBack,
    handleGameSelect,
    handleBackFromBoard,
    handleNavigateToEditUsername,
    handleNavigateToEditEmail,
    handleBackToProfile,
    replayGame,
    handleOpenHistory,
    handleBackFromHistory,
    handleOpenReplay,
    handleBackFromReplay,
    handleNavigateToNostr,
    handleBackFromNostr,
    walletBalance,
    setWalletBalance,
    showNewGameModal,
    setShowNewGameModal,
    handleCreateGame,
    handleOpenWallet,
    handleBackFromWallet,
    lightningAddress,
    setLightningAddress,
    handleOpenEditLightningAddress,
    handleBackFromLightningAddress,
    handleLightningAddressSaved,
    handleOpenDashboard,
    handleBackFromDashboard,
    handleOpenChat,
    handleCloseChat,
  };
}
