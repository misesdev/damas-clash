import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {showMessage} from '../components/MessageBox';
import {cancelGame, createGame, getGame} from '../api/games';
import {refreshAccessToken} from '../api/auth';
import {getWallet} from '../api/wallet';
import {getPlayer} from '../api/players';
import {BASE_URL} from '../api/client';
import {clearSession, loadSession, saveSession} from '../storage/auth';
import {clearActiveGameId, loadActiveGameId, saveActiveGameId} from '../storage/game';
import {saveLightningAddress} from '../storage/lightning';
import {loadLanguage} from '../storage/language';
import i18n from '../i18n';
import type {TabName} from '../components/BottomTabBar';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';
import type {WalletResponse} from '../types/wallet';
import type {OnlinePlayerInfo} from '../types/player';

export type Screen = 'login' | 'register' | 'confirmEmail' | 'verifyLogin' | 'nostrLogin';
export type AuthScreen = 'tabs' | 'waitingRoom' | 'checkersBoard' | 'editUsername' | 'editEmail' | 'gameHistory' | 'replay' | 'deposit' | 'withdraw' | 'editLightningAddress' | 'walletHistory' | 'playerProfile' | 'dashboard' | 'chat';

const REFRESH_BUFFER_MS = 2 * 60 * 1000; // refresh 2 min before expiry

export function useApp() {
  const {t} = useTranslation();
  const [screen, setScreen] = useState<Screen>('login');
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
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [lightningAddress, setLightningAddress] = useState<string | null>(null);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<{playerId: string; username: string; avatarUrl?: string | null} | null>(null);

  // ── Wallet ────────────────────────────────────────────────────────────────

  const fetchWallet = useCallback(async () => {
    if (!session) {return;}
    setWalletLoading(true);
    try {
      const data = await getWallet(session.token);
      setWallet(data);
    } catch { /* silently ignore */ } finally {
      setWalletLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // Refs to avoid stale closures in async callbacks
  const authScreenRef = useRef<AuthScreen>('tabs');
  useEffect(() => {
    authScreenRef.current = authScreen;
  }, [authScreen]);

  const pendingGameIdRef = useRef<string | null>(null);
  const hubRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Restore saved language preference
        const savedLang = await loadLanguage();
        if (savedLang && !cancelled) {
          i18n.changeLanguage(savedLang);
        }

        const saved = await loadSession();
        if (cancelled) {return;}
        if (saved) {
          setSession(saved);
          const gameId = await loadActiveGameId();
          if (gameId && !cancelled) {
            try {
              const activeGame = await getGame(saved.token, gameId);
              if (!cancelled && activeGame.status === 'InProgress') {
                setSelectedGame(activeGame);
                setAuthScreen('checkersBoard');
              } else {
                clearActiveGameId();
              }
            } catch {
              clearActiveGameId();
            }
          }
        }

        if (saved && !cancelled) {
          try {
            const profile = await getPlayer(saved.token, saved.playerId);
            if (!cancelled) {setLightningAddress(profile.lightningAddress);}
          } catch { /* silently ignore */ }
        }
      } finally {
        if (!cancelled) {setLoading(false);}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Proactive token refresh ────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.refreshToken || !session?.expiresAt) {return;}

    const expiryMs = new Date(session.expiresAt).getTime();
    const delay = Math.max(0, expiryMs - Date.now() - REFRESH_BUFFER_MS);

    const timer = setTimeout(async () => {
      try {
        const renewed = await refreshAccessToken(session.refreshToken);
        const updated = {...session, ...renewed};
        saveSession(updated);
        setSession(updated);
      } catch {
        handleLogout();
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  // ── Persistent SignalR connection (lobby + game events) ───────────────────

  useEffect(() => {
    if (!session) {return;}

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
          if (!active) {return;}
          setLiveGames(games);
        });

        hub.on('OnlinePlayersUpdated', (players: OnlinePlayerInfo[]) => {
          if (!active || !Array.isArray(players)) {return;}
          setOnlinePlayers(players);
        });

        hub.on('ChallengeReceived', (fromId: string, fromUsername: string) => {
          if (!active) {return;}
          showMessage({
            title: t('challenges.receivedTitle', {username: fromUsername}),
            message: t('challenges.receivedMessage'),
            type: 'confirm',
            actions: [
              {
                label: t('challenges.decline'),
                onPress: () => hub.invoke('DeclineChallenge', fromId).catch(() => {}),
              },
              {
                label: t('challenges.accept'),
                primary: true,
                onPress: () => hub.invoke('AcceptChallenge', fromId).catch(() => {}),
              },
            ],
          });
        });

        hub.on('ChallengeDeclined', (byUsername: string) => {
          if (!active) {return;}
          setPendingChallengeId(null);
          showMessage({
            title: t('challenges.declinedTitle'),
            message: t('challenges.declinedMessage', {username: byUsername}),
            type: 'info',
            actions: [{label: t('common.ok')}],
          });
        });

        hub.on('ChallengeCancelled', () => {
          if (!active) {return;}
          showMessage({
            title: t('challenges.cancelledTitle'),
            message: t('challenges.cancelledMessage'),
            type: 'info',
            actions: [{label: t('common.ok')}],
          });
        });

        hub.on('ChallengeError', (reason: string) => {
          if (!active) {return;}
          setPendingChallengeId(null);
          const messages: Record<string, string> = {
            player_offline: t('challenges.errors.player_offline'),
            challenge_expired: t('challenges.errors.challenge_expired'),
            create_failed: t('challenges.errors.create_failed'),
          };
          showMessage({
            title: t('challenges.errorTitle'),
            message: messages[reason] ?? t('challenges.errorDefault'),
            type: 'info',
            actions: [{label: t('common.ok')}],
          });
        });

        hub.on('GameStarted', (game: GameResponse) => {
          if (!active) {return;}
          setPendingGameId(null);
          setPendingChallengeId(null);
          setShowOnlinePlayers(false);
          saveActiveGameId(game.id);

          if (authScreenRef.current === 'waitingRoom') {
            setSelectedGame(game);
            setAuthScreen('checkersBoard');
          } else {
            showMessage({
              title: t('gameStarted.title'),
              message: t('gameStarted.message'),
              type: 'confirm',
              actions: [
                {label: t('gameStarted.later')},
                {
                  label: t('gameStarted.play'),
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
          if (!active) {return;}
          try {
            await hub.invoke('JoinLobby');
            if (pendingGameIdRef.current) {
              await hub.invoke('WatchGame', pendingGameIdRef.current);
            }
          } catch { /* silently ignore */ }
        });

        await hub.start();
        if (!active) {hub.stop(); return;}

        hubRef.current = hub;
        await hub.invoke('JoinLobby');

        if (pendingGameIdRef.current) {
          await hub.invoke('WatchGame', pendingGameIdRef.current);
        }
      } catch {
        // Connection failed — silently ignore
      }
    })();

    return () => {
      active = false;
      hubRef.current = null;
      hub?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  // ── Watch game when pendingGameId changes ─────────────────────────────────

  useEffect(() => {
    pendingGameIdRef.current = pendingGameId;
    const hub = hubRef.current;
    if (!hub || hub.state !== HubConnectionState.Connected) {return;}
    if (pendingGameId) {
      hub.invoke('WatchGame', pendingGameId).catch(() => {});
    }
  }, [pendingGameId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleLogin = (data: LoginResponse) => {
    saveSession(data);
    setSession(data);
    if (data.lightningAddress) {
      saveLightningAddress(data.lightningAddress);
    }
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
    setPendingChallengeId(null);
  };

  const handleChallengePlayer = (targetPlayerId: string) => {
    setPendingChallengeId(targetPlayerId);
    hubRef.current?.invoke('ChallengePlayer', targetPlayerId).catch(() => {
      setPendingChallengeId(null);
    });
  };

  const handleCancelChallenge = (targetPlayerId: string) => {
    setPendingChallengeId(null);
    hubRef.current?.invoke('CancelChallenge', targetPlayerId).catch(() => {});
  };

  const handleWatchOnlineGame = async (gameId: string) => {
    if (!session) {return;}
    setShowOnlinePlayers(false);
    try {
      const game = await getGame(session.token, gameId);
      handleGameSelect(game);
    } catch {
      // silently ignore
    }
  };

  const handleNewGame = () => {
    if (creatingGame) {return;}
    setShowCreateModal(true);
  };

  const handleConfirmCreateGame = async (betAmountSats: number) => {
    if (!session || creatingGame) {return;}
    setShowCreateModal(false);

    const existingGame = liveGames?.find(
      g => g.playerBlackId === session.playerId && g.status === 'WaitingForPlayers',
    );
    // Reuse an existing pending game only when it has the exact same bet amount
    if (existingGame && existingGame.betAmountSats === betAmountSats) {
      setSelectedGame(existingGame);
      setPendingGameId(existingGame.id);
      setAuthScreen('waitingRoom');
      return;
    }

    setCreatingGame(true);
    try {
      const game = await createGame(session.token, betAmountSats);
      setSelectedGame(game);
      setPendingGameId(game.id);
      setAuthScreen('waitingRoom');
      if (betAmountSats > 0) {fetchWallet();}
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('createGame.errors.failed');
      showMessage({
        title: t('createGame.errors.title'),
        message: msg,
        type: 'error',
        actions: [{label: t('common.ok')}],
      });
    } finally {
      setCreatingGame(false);
    }
  };

  const handleCancelWaitingRoom = async () => {
    if (!session || !selectedGame) {return;}
    await cancelGame(session.token, selectedGame.id);
    setSelectedGame(null);
    setAuthScreen('tabs');
    setTab('home');
    // Keep pendingGameId — notification fires if opponent joins before cancel propagates
  };

  const handleWaitingRoomBack = () => {
    setAuthScreen('tabs');
    setTab('home');
    // Keep pendingGameId — notification fires if opponent joins later
  };

  const handleGameSelect = (game: GameResponse) => {
    setSelectedGame(game);
    setAuthScreen('checkersBoard');
    const isPlayer =
      game.playerBlackId === session?.playerId ||
      game.playerWhiteId === session?.playerId;
    if (isPlayer && game.status === 'InProgress') {
      saveActiveGameId(game.id);
    }
  };

  const handleBackFromBoard = () => {
    clearActiveGameId();
    setAuthScreen('tabs');
    setSelectedGame(null);
  };

  const handleOpenDeposit = () => setAuthScreen('deposit');
  const handleOpenWithdraw = () => setAuthScreen('withdraw');
  const handleOpenWalletHistory = () => setAuthScreen('walletHistory');
  const handleViewPlayerProfile = (playerId: string, username: string, avatarUrl?: string | null) => {
    setSelectedPlayerProfile({playerId, username, avatarUrl});
    setShowOnlinePlayers(false);
    setAuthScreen('playerProfile');
  };
  const handleBackFromPlayerProfile = () => {
    setSelectedPlayerProfile(null);
    setAuthScreen('tabs');
  };
  const handleOpenEditLightningAddress = () => setAuthScreen('editLightningAddress');
  const handleBackFromWallet = () => {setAuthScreen('tabs'); fetchWallet();};
  const handleLightningAddressSaved = (addr: string | null) => {
    setLightningAddress(addr);
    setAuthScreen('tabs');
    setTab('profile');
  };

  const handleNavigateToEditUsername = () => setAuthScreen('editUsername');
  const handleNavigateToEditEmail = () => setAuthScreen('editEmail');
  const handleOpenDashboard = () => setAuthScreen('dashboard');
  const handleBackFromDashboard = () => { setAuthScreen('tabs'); };

  const handleOpenChat = () => setAuthScreen('chat');
  const handleCloseChat = () => setAuthScreen('tabs');

  const handleOpenHistory = () => setAuthScreen('gameHistory');
  const handleBackFromHistory = () => {setAuthScreen('tabs'); setTab('profile');};
  const handleOpenReplay = (game: GameResponse) => {setReplayGame(game); setAuthScreen('replay');};
  const handleBackFromReplay = () => setAuthScreen('gameHistory');

  const handleBackToProfile = () => {
    setAuthScreen('tabs');
    setTab('profile');
  };

  const updateSession = (updates: Partial<LoginResponse>) => {
    if (!session) {return;}
    const updated = {...session, ...updates};
    saveSession(updated);
    setSession(updated);
  };

  return {
    // Navigation state
    screen,
    setScreen,
    authScreen,
    tab,
    setTab,
    // Auth
    pendingEmail,
    setPendingEmail,
    session,
    loading,
    handleLogin,
    handleLogout,
    updateSession,
    // Games
    selectedGame,
    pendingGameId,
    setPendingGameId,
    creatingGame,
    liveGames,
    onlinePlayers,
    onlineCount: onlinePlayers.length || null,
    showOnlinePlayers,
    setShowOnlinePlayers,
    pendingChallengeId,
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
    handleChallengePlayer,
    handleCancelChallenge,
    handleWatchOnlineGame,
    // Wallet
    wallet,
    walletLoading,
    fetchWallet,
    showCreateModal,
    setShowCreateModal,
    handleConfirmCreateGame,
    handleOpenDeposit,
    handleOpenWithdraw,
    handleOpenWalletHistory,
    selectedPlayerProfile,
    handleViewPlayerProfile,
    handleBackFromPlayerProfile,
    handleOpenEditLightningAddress,
    handleBackFromWallet,
    handleLightningAddressSaved,
    lightningAddress,
    handleOpenDashboard,
    handleBackFromDashboard,
    handleOpenChat,
    handleCloseChat,
  };
}
