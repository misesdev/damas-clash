import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import {useEffect, useRef, useState} from 'react';
import {showMessage} from '../components/MessageBox';
import {cancelGame, createGame, getGame} from '../api/games';
import {refreshAccessToken} from '../api/auth';
import {BASE_URL} from '../api/client';
import {clearSession, loadSession, saveSession} from '../storage/auth';
import {clearActiveGameId, loadActiveGameId, saveActiveGameId} from '../storage/game';
import type {TabName} from '../components/BottomTabBar';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';

type Screen = 'login' | 'register' | 'confirmEmail' | 'verifyLogin';
type AuthScreen = 'tabs' | 'waitingRoom' | 'checkersBoard' | 'editUsername' | 'editEmail' | 'gameHistory' | 'replay';

const REFRESH_BUFFER_MS = 2 * 60 * 1000; // refresh 2 min before expiry

export function useApp() {
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
          })
          .withAutomaticReconnect()
          .build();

        hub.on('GameListUpdated', (games: GameResponse[]) => {
          if (!active) {return;}
          setLiveGames(games);
        });

        hub.on('GameStarted', (game: GameResponse) => {
          if (!active) {return;}
          setPendingGameId(null);
          saveActiveGameId(game.id);

          if (authScreenRef.current === 'waitingRoom') {
            setSelectedGame(game);
            setAuthScreen('checkersBoard');
          } else {
            showMessage({
              title: 'Oponente encontrado!',
              message: 'Alguém entrou na sua partida. Deseja jogar agora?',
              type: 'confirm',
              actions: [
                {label: 'Depois'},
                {
                  label: 'Jogar',
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
  };

  const handleNewGame = async () => {
    if (!session || creatingGame) {return;}

    const existingGame = liveGames?.find(
      g => g.playerBlackId === session.playerId && g.status === 'WaitingForPlayers',
    );
    if (existingGame) {
      setSelectedGame(existingGame);
      setPendingGameId(existingGame.id);
      setAuthScreen('waitingRoom');
      return;
    }

    setCreatingGame(true);
    try {
      const game = await createGame(session.token);
      setSelectedGame(game);
      setPendingGameId(game.id);
      setAuthScreen('waitingRoom');
    } catch (ex) {
      console.log(ex);
      // silently ignore
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

  const handleNavigateToEditUsername = () => setAuthScreen('editUsername');
  const handleNavigateToEditEmail = () => setAuthScreen('editEmail');

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
  };
}
