import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import {AppState, type AppStateStatus} from 'react-native';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {showMessage} from '../components/MessageBox';
import {cancelGame, createGame, getGame, listGames} from '../api/games';
import {refreshAccessToken} from '../api/auth';
import {getWallet} from '../api/wallet';
import {getPlayer} from '../api/players';
import {ApiError, BASE_URL} from '../api/client';
import {clearSession, loadSession, saveSession} from '../storage/auth';
import {hasUnreadChatMessages, markChatViewed} from '../storage/chatCache';
import {clearActiveGameId, loadActiveGameId, saveActiveGameId} from '../storage/game';
import {saveLightningAddress} from '../storage/lightning';
import {loadLanguage} from '../storage/language';
import i18n from '../i18n';
import type {TabName} from '../components/BottomTabBar';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';
import type {WalletResponse} from '../types/wallet';
import type {OnlinePlayerInfo} from '../types/player';
import {
  hasNotificationPermission,
  requestNotificationPermission,
  getFCMToken,
  setupForegroundHandler,
  setupNotificationOpenedHandler,
  getInitialNotification,
  setupTokenRefreshHandler,
  type NotificationPayload,
} from '../services/pushNotifications';
import {hasSeenNotificationPrompt, markNotificationPromptSeen} from '../storage/notifications';
import {registerFCMToken, unregisterFCMToken} from '../api/notifications';
import {APP_VERSION, fetchMinVersion, isVersionOutdated} from '../api/appVersion';
import {connectAuthRelays, disconnectAuthRelays} from '../services/nostr/sharedAuthRelays';

export type Screen = 'login' | 'register' | 'confirmEmail' | 'verifyLogin' | 'nostrLogin' | 'nostrRegister' | 'nostrAuth';
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
  const [updateRequired, setUpdateRequired] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
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
  const [screenBeforePlayerProfile, setScreenBeforePlayerProfile] = useState<AuthScreen>('tabs');
  const [hasChatUnread, setHasChatUnread] = useState(false);

  // ── Push Notifications ───────────────────────────────────────────────────

  const initPushNotifications = useCallback(async (authToken: string) => {
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {return;}
      const token = await getFCMToken();
      if (token) {
        await registerFCMToken(token, authToken, i18n.language);
      }
    } catch { /* silently ignore — notifications are non-critical */ }
  }, []);

  /** Called when the user taps "Allow" on the notification permission screen. */
  const handleAllowNotifications = useCallback(async () => {
    await markNotificationPromptSeen();
    // Request OS permission BEFORE hiding the screen so the system dialog
    // opens while our activity is fully in the foreground.
    await requestNotificationPermission().catch(() => {});
    setShowNotificationPrompt(false);
    // Register the FCM token immediately if the user is already logged in.
    // If not logged in yet, initPushNotifications is called after login.
    if (sessionRef.current?.token) {
      initPushNotifications(sessionRef.current.token).catch(() => {});
    }
  }, [initPushNotifications]);

  /** Called when the user taps "Not now" on the notification permission screen. */
  const handleDismissNotificationPrompt = useCallback(async () => {
    await markNotificationPromptSeen();
    setShowNotificationPrompt(false);
  }, []);

  // Navigate based on notification type (tap from background or killed state).
  // Also triggers a game-list refresh so the user sees the new game immediately.
  const handleNotificationOpen = useCallback((payload: NotificationPayload) => {
    // Never navigate away while the user is actively playing
    if (authScreenRef.current === 'checkersBoard') {return;}
    if (payload.type === 'game_created' || payload.type === 'player_joined') {
      setAuthScreen('tabs');
      setTab('home');
      // Refresh the game list so the newly created game appears right away,
      // even if the SignalR GameListUpdated event hasn't arrived yet.
      const token = sessionRef.current?.token;
      if (token) {
        listGames(token).then(games => setLiveGames(games)).catch(() => {});
      }
    } else if (payload.type === 'chat_mention' || payload.type === 'chat_reply') {
      setAuthScreen('chat');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background tap handler: registered immediately (empty deps) so it fires
  // even when the JS thread was killed by the OS and restarts on notification tap.
  // If the session hasn't loaded yet, the payload is stored and applied once ready.
  useEffect(() => {
    return setupNotificationOpenedHandler(payload => {
      if (sessionRef.current) {
        handleNotificationOpen(payload);
      } else {
        // Session still loading from Keychain — defer navigation
        pendingNotificationRef.current = payload;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply a deferred notification tap once the session finishes loading.
  useEffect(() => {
    if (!session || !pendingNotificationRef.current) {return;}
    const pending = pendingNotificationRef.current;
    pendingNotificationRef.current = null;
    handleNotificationOpen(pending);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.playerId]);

  // Foreground FCM handler: show in-app alert when a notification arrives while app is open
  useEffect(() => {
    if (!session) {return;}
    return setupForegroundHandler((payload) => {
      // Never interrupt the user while they are actively playing
      if (authScreenRef.current === 'checkersBoard') {return;}
      if (payload.type === 'chat_mention') {
        if (authScreenRef.current !== 'chat') {setHasChatUnread(true);}
        showMessage({
          title: t('notifications.mentionTitle', {username: payload.data.senderUsername}),
          message: payload.data.messageText,
          type: 'info',
          actions: [
            {label: t('common.ok')},
            {
              label: t('notifications.openChat'),
              primary: true,
              onPress: () => setAuthScreen('chat'),
            },
          ],
        });
      } else if (payload.type === 'chat_reply') {
        if (authScreenRef.current !== 'chat') {setHasChatUnread(true);}
        showMessage({
          title: t('notifications.replyTitle', {username: payload.data.replierUsername}),
          message: payload.data.messageText,
          type: 'info',
          actions: [
            {label: t('common.ok')},
            {
              label: t('notifications.openChat'),
              primary: true,
              onPress: () => setAuthScreen('chat'),
            },
          ],
        });
      } else if (payload.type === 'game_created') {
        showMessage({
          title: t('notifications.gameCreatedTitle', {username: payload.data.creatorUsername}),
          message: t('notifications.gameCreatedBody'),
          type: 'info',
          actions: [
            {label: t('common.ok')},
            {
              label: t('notifications.openGames'),
              primary: true,
              onPress: () => {
                setAuthScreen('tabs');
                setTab('home');
                // Refresh game list immediately so the new game is visible right away
                const token = sessionRef.current?.token;
                if (token) {
                  listGames(token).then(games => setLiveGames(games)).catch(() => {});
                }
              },
            },
          ],
        });
      } else if (payload.type === 'player_joined') {
        showMessage({
          title: t('notifications.playerJoinedTitle', {username: payload.data.joinerUsername}),
          message: t('notifications.playerJoinedBody'),
          type: 'info',
          actions: [
            {label: t('common.ok')},
            {
              label: t('notifications.openGame'),
              primary: true,
              onPress: () => {
                setAuthScreen('tabs');
                setTab('home');
                const token = sessionRef.current?.token;
                if (token) {
                  listGames(token).then(games => setLiveGames(games)).catch(() => {});
                }
              },
            },
          ],
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.playerId]);

  // FCM token rotation: re-register with the backend whenever Firebase rotates the token
  useEffect(() => {
    if (!session) {return;}
    return setupTokenRefreshHandler(newToken => {
      registerFCMToken(newToken, sessionRef.current?.token ?? '', i18n.language).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.playerId]);

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

  // Always-current session ref — lets the hub's accessTokenFactory return the
  // latest token without needing to recreate the hub on every token refresh.
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Guards concurrent refresh calls — e.g. proactive timer + AppState foreground
  // firing at the same time. Both callers await the same in-flight promise.
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  /**
   * Attempts a token refresh. Returns true if the session should be kept
   * (success or transient network error) and false if the session is invalid
   * (401/403) and the caller should trigger logout.
   * Concurrent calls share the same in-flight promise to avoid rotating the
   * refresh token twice, which would cause the second caller to receive 401.
   */
  const doTokenRefresh = useCallback(async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    const promise = (async () => {
      const current = sessionRef.current;
      if (!current?.refreshToken) {return false;}
      try {
        const renewed = await refreshAccessToken(current.refreshToken);
        const updated = {...current, ...renewed};
        saveSession(updated);
        setSession(updated);
        return true;
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          return false; // token revoked — caller should logout
        }
        return true; // transient network error — keep session
      } finally {
        refreshPromiseRef.current = null;
      }
    })();
    refreshPromiseRef.current = promise;
    return promise;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refs to avoid stale closures in async callbacks
  const authScreenRef = useRef<AuthScreen>('tabs');
  useEffect(() => {
    authScreenRef.current = authScreen;
  }, [authScreen]);

  const pendingGameIdRef = useRef<string | null>(null);
  const hubRef = useRef<HubConnection | null>(null);
  // Stores a notification tap that arrived before the session was loaded.
  // Applied as soon as the session becomes available.
  const pendingNotificationRef = useRef<NotificationPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Restore saved language preference
        const savedLang = await loadLanguage();
        if (savedLang && !cancelled) {
          i18n.changeLanguage(savedLang);
        }

        // Check minimum required app version before doing anything else.
        // If the server is unreachable, we let the user in (fail open).
        const minVersion = await fetchMinVersion();
        if (!cancelled && minVersion && isVersionOutdated(APP_VERSION, minVersion)) {
          setUpdateRequired(true);
          return;
        }

        const saved = await loadSession();
        if (cancelled) {return;}
        if (saved) {
          setSession(saved);
          // Show cached lightning address immediately — avoids blank until API responds
          setLightningAddress(saved.lightningAddress ?? null);

          // Re-register FCM token on every app startup so that a new token
          // issued after reinstall / app update is always recorded in the API.
          initPushNotifications(saved.token);

          // Check if the app was opened by tapping a notification (killed state)
          const initialNotif = await getInitialNotification();

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

          // Apply notification deep-link after active game check
          // (active game takes priority; if no active game, route to notification target)
          if (initialNotif && !cancelled && authScreenRef.current !== 'checkersBoard') {
            handleNotificationOpen(initialNotif);
          }
        }

        if (saved && !cancelled) {
          try {
            const profile = await getPlayer(saved.token, saved.playerId);
            if (!cancelled) {
              const addr = profile.lightningAddress ?? null;
              setLightningAddress(addr);
              // Keep session in Keychain in sync so next cold start shows correct value
              if (addr !== (saved.lightningAddress ?? null)) {
                const updated = {...saved, lightningAddress: addr};
                saveSession(updated);
                setSession(updated);
              }
            }
          } catch { /* silently ignore */ }
        }

        // After all startup is done, show notification permission prompt if needed.
        // Shown once: only when permission hasn't been granted AND the user hasn't seen it yet.
        if (!cancelled) {
          const [alreadyGranted, alreadySeen, chatUnread] = await Promise.all([
            hasNotificationPermission(),
            hasSeenNotificationPrompt(),
            hasUnreadChatMessages(),
          ]);
          if (!alreadyGranted && !alreadySeen) {
            setShowNotificationPrompt(true);
          }
          setHasChatUnread(chatUnread);
        }
      } finally {
        if (!cancelled) {setLoading(false);}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Auth relay pre-warming ────────────────────────────────────────────────
  // Connect to Nostr relays while the user is logged out so that NostrLogin
  // and NostrRegister screens can publish events without waiting for a fresh
  // connection. Disconnect once the user is authenticated.

  useEffect(() => {
    if (!session) {
      connectAuthRelays().catch(() => {});
    } else {
      disconnectAuthRelays();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.playerId]);

  // ── Proactive token refresh ────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.refreshToken || !session?.expiresAt) {return;}

    const expiryMs = new Date(session.expiresAt).getTime();
    const delay = Math.max(0, expiryMs - Date.now() - REFRESH_BUFFER_MS);

    const timer = setTimeout(async () => {
      const ok = await doTokenRefresh();
      if (!ok) {handleLogout();}
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  // ── Persistent chat hub — tracks unread messages even when ChatScreen is closed ──

  useEffect(() => {
    if (!session) {return;}

    let hub: HubConnection;
    let active = true;

    (async () => {
      try {
        hub = new HubConnectionBuilder()
          .withUrl(`${BASE_URL}/hubs/chat`, {
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true,
            accessTokenFactory: () => sessionRef.current?.token ?? '',
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: ctx => {
              const delays = [0, 2000, 5000, 10000, 30000];
              return delays[Math.min(ctx.previousRetryCount, delays.length - 1)];
            },
          })
          .build();

        hub.on('NewMessage', () => {
          if (!active) {return;}
          if (authScreenRef.current !== 'chat') {
            setHasChatUnread(true);
          }
        });

        // Retry initial connection — withAutomaticReconnect doesn't cover first start()
        const chatStartDelays = [0, 2000, 5000, 10000, 30000];
        for (let attempt = 0; ; attempt++) {
          try {
            await hub.start();
            break;
          } catch {
            if (!active) {return;}
            const delay = chatStartDelays[Math.min(attempt, chatStartDelays.length - 1)];
            await new Promise<void>(resolve => setTimeout(resolve, delay));
            if (!active) {return;}
          }
        }
        if (!active) {hub.stop();}
      } catch {
        // silently ignore — unread tracking is non-critical
      }
    })();

    return () => {
      active = false;
      hub?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.playerId]);

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
            // Always read from ref so a refreshed token is used automatically
            // on reconnect without recreating the entire hub.
            accessTokenFactory: () => sessionRef.current?.token ?? '',
          })
          .withAutomaticReconnect({
            // Retry indefinitely: 0 → 2 s → 5 s → 10 s → 30 s → 60 s forever
            nextRetryDelayInMilliseconds: ctx => {
              const delays = [0, 2000, 5000, 10000, 30000];
              return delays[Math.min(ctx.previousRetryCount, delays.length - 1)];
            },
          })
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
          // Retry JoinLobby up to 3 times with backoff. A single silent-ignore
          // left the client outside the lobby group with no further events.
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await hub.invoke('JoinLobby');
              if (pendingGameIdRef.current) {
                await hub.invoke('WatchGame', pendingGameIdRef.current);
              }
              return; // success
            } catch {
              if (!active) {return;}
              if (attempt < 2) {
                await new Promise<void>(r => setTimeout(r, 1000 * (attempt + 1)));
              }
            }
          }
        });

        // When the connection is permanently closed (all retries exhausted),
        // clear stale data so the UI reflects the disconnected state.
        hub.onclose(() => {
          if (!active) {return;}
          setLiveGames(null);
          setOnlinePlayers([]);
        });

        // Retry initial connection with backoff.
        // withAutomaticReconnect only fires AFTER a successful connect — a
        // failed hub.start() leaves the hub in Disconnected forever without this.
        const startDelays = [0, 2000, 5000, 10000, 30000, 60000];
        for (let attempt = 0; ; attempt++) {
          try {
            await hub.start();
            break;
          } catch {
            if (!active) {return;}
            const delay = startDelays[Math.min(attempt, startDelays.length - 1)];
            await new Promise<void>(resolve => setTimeout(resolve, delay));
            if (!active) {return;}
          }
        }

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
    // Depend on playerId (not token) so the hub is only recreated on login/
    // logout — not on every token refresh. The accessTokenFactory reads from
    // sessionRef so it always supplies the latest token on reconnect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.playerId]);

  // ── AppState: recover from background ────────────────────────────────────
  // When Android suspends the JS thread while in background, the proactive
  // token-refresh setTimeout may not fire. When the app comes back to
  // foreground we check:
  //   1. If the token is expired / near expiry → refresh immediately so
  //      SignalR's reconnect attempt uses a valid token.
  //   2. If the hub is already Connected (WebSocket survived background) →
  //      re-invoke JoinLobby to get a fresh OnlinePlayersUpdated event.

  useEffect(() => {
    if (!session) {return;}

    let prevState: AppStateStatus = AppState.currentState;

    const sub = AppState.addEventListener('change', async nextState => {
      const returningToForeground =
        (prevState === 'background' || prevState === 'inactive') &&
        nextState === 'active';
      prevState = nextState;

      if (!returningToForeground || !sessionRef.current) {return;}

      // 1. Proactive token refresh if near/past expiry
      const {expiresAt} = sessionRef.current;
      const msLeft = expiresAt
        ? new Date(expiresAt).getTime() - Date.now()
        : 0;
      if (msLeft < REFRESH_BUFFER_MS) {
        // doTokenRefresh deduplicates concurrent calls with the proactive timer
        const ok = await doTokenRefresh();
        if (!ok) {handleLogout(); return;}
      }

      // 2. Re-join lobby if hub is already connected (missed events while backgrounded)
      const hub = hubRef.current;
      if (hub?.state === HubConnectionState.Connected) {
        hub.invoke('JoinLobby').catch(() => {});
      }
    });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.playerId]);

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
    // Fire-and-forget: request permission + register FCM token with the backend
    initPushNotifications(data.token);
  };

  const handleLogout = () => {
    // Unregister FCM tokens before clearing the session token
    if (sessionRef.current) {
      unregisterFCMToken(sessionRef.current.token).catch(() => {});
    }
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
    setScreenBeforePlayerProfile(authScreen);
    setSelectedPlayerProfile({playerId, username, avatarUrl});
    setShowOnlinePlayers(false);
    setAuthScreen('playerProfile');
  };
  const handleBackFromPlayerProfile = () => {
    setSelectedPlayerProfile(null);
    setAuthScreen(screenBeforePlayerProfile);
  };
  const handleOpenEditLightningAddress = () => setAuthScreen('editLightningAddress');
  const handleBackFromWallet = () => {setAuthScreen('tabs'); fetchWallet();};
  const handleLightningAddressSaved = (addr: string | null) => {
    setLightningAddress(addr);
    // Persist to session so cold-start shows the correct value without an API call
    updateSession({lightningAddress: addr});
    setAuthScreen('tabs');
    setTab('profile');
  };

  const handleNavigateToEditUsername = () => setAuthScreen('editUsername');
  const handleNavigateToEditEmail = () => setAuthScreen('editEmail');
  const handleOpenDashboard = () => setAuthScreen('dashboard');
  const handleBackFromDashboard = () => { setAuthScreen('tabs'); };

  const handleOpenChat = () => {
    setAuthScreen('chat');
    setHasChatUnread(false);
    markChatViewed();
  };
  const handleCloseChat = () => setAuthScreen('tabs');

  /** Called by useChatScreen when a new SignalR message arrives outside the chat screen. */
  const handleNewChatMessage = () => {
    if (authScreenRef.current !== 'chat') {
      setHasChatUnread(true);
    }
  };

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
    updateRequired,
    dismissUpdate: () => setUpdateRequired(false),
    showNotificationPrompt,
    handleAllowNotifications,
    handleDismissNotificationPrompt,
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
    hasChatUnread,
    handleOpenChat,
    handleCloseChat,
    handleNewChatMessage,
  };
}
