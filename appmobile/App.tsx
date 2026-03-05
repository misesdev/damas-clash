import {HubConnectionBuilder, HttpTransportType} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {login, resendConfirmation, verifyLogin} from './src/api/auth';
import {BASE_URL} from './src/api/client';
import {BottomTabBar} from './src/components/BottomTabBar';
import type {TabName} from './src/components/BottomTabBar';
import {CheckersBoardScreen} from './src/screens/CheckersBoardScreen';
import {ConfirmEmailScreen} from './src/screens/ConfirmEmailScreen';
import {EditEmailScreen} from './src/screens/EditEmailScreen';
import {EditUsernameScreen} from './src/screens/EditUsernameScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {ProfileScreen} from './src/screens/ProfileScreen';
import {RegisterScreen} from './src/screens/RegisterScreen';
import {WaitingRoomScreen} from './src/screens/WaitingRoomScreen';
import {clearSession, loadSession, saveSession} from './src/storage/auth';
import {colors} from './src/theme/colors';
import type {LoginResponse} from './src/types/auth';
import type {GameResponse} from './src/types/game';

type Screen = 'login' | 'register' | 'confirmEmail' | 'verifyLogin';
type AuthScreen = 'tabs' | 'waitingRoom' | 'checkersBoard' | 'editUsername' | 'editEmail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('tabs');
  const [tab, setTab] = useState<TabName>('home');
  const [pendingEmail, setPendingEmail] = useState('');
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameResponse | null>(null);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep a ref to authScreen to avoid stale closures in SignalR handlers
  const authScreenRef = useRef<AuthScreen>('tabs');
  useEffect(() => {
    authScreenRef.current = authScreen;
  }, [authScreen]);

  useEffect(() => {
    loadSession()
      .then(saved => {
        if (saved) {setSession(saved);}
      })
      .finally(() => setLoading(false));
  }, []);

  // SignalR: listen for GameStarted on the pending game
  useEffect(() => {
    if (!session || !pendingGameId) {return;}

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

        hub.on('GameStarted', (game: GameResponse) => {
          if (!active) {return;}
          setPendingGameId(null);

          if (authScreenRef.current === 'waitingRoom') {
            setSelectedGame(game);
            setAuthScreen('checkersBoard');
          } else {
            Alert.alert(
              'Oponente encontrado!',
              'Alguém entrou na sua partida. Deseja jogar agora?',
              [
                {
                  text: 'Jogar',
                  onPress: () => {
                    setSelectedGame(game);
                    setAuthScreen('checkersBoard');
                  },
                },
                {text: 'Depois', style: 'cancel'},
              ],
            );
          }
        });

        await hub.start();
        await hub.invoke('WatchGame', pendingGameId);
      } catch {
        // Connection failed — silently ignore; user can still play when they enter the board
      }
    })();

    return () => {
      active = false;
      hub?.stop();
    };
  }, [pendingGameId, session?.token]);

  const handleLogin = (data: LoginResponse) => {
    saveSession(data);
    setSession(data);
    setAuthScreen('tabs');
    setTab('home');
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setScreen('login');
    setAuthScreen('tabs');
    setPendingGameId(null);
  };

  const updateSession = (updates: Partial<LoginResponse>) => {
    if (!session) {return;}
    const updated = {...session, ...updates};
    saveSession(updated);
    setSession(updated);
  };

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (session) {
    // Full-screen overlay screens
    if (authScreen === 'waitingRoom' && selectedGame) {
      return (
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
          <WaitingRoomScreen
            game={selectedGame}
            onCancel={() => {
              setAuthScreen('tabs');
              setTab('home');
              // Keep pendingGameId so notification fires if opponent joins later
            }}
          />
        </SafeAreaProvider>
      );
    }

    if (authScreen === 'checkersBoard') {
      return (
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
          <CheckersBoardScreen
            onBack={() => {
              setAuthScreen('tabs');
              setSelectedGame(null);
            }}
          />
        </SafeAreaProvider>
      );
    }

    if (authScreen === 'editUsername') {
      return (
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
          <EditUsernameScreen
            user={session}
            onSaved={newUsername => {
              updateSession({username: newUsername});
              setAuthScreen('tabs');
              setTab('profile');
            }}
            onBack={() => {
              setAuthScreen('tabs');
              setTab('profile');
            }}
          />
        </SafeAreaProvider>
      );
    }

    if (authScreen === 'editEmail') {
      return (
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
          <EditEmailScreen
            user={session}
            onSaved={newEmail => {
              updateSession({email: newEmail});
              setAuthScreen('tabs');
              setTab('profile');
            }}
            onBack={() => {
              setAuthScreen('tabs');
              setTab('profile');
            }}
          />
        </SafeAreaProvider>
      );
    }

    // Tab layout
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <View style={styles.tabContainer}>
          <View style={styles.tabContent}>
            {tab === 'home' ? (
              <HomeScreen
                user={session}
                onGameSelect={game => {
                  setSelectedGame(game);
                  setAuthScreen('checkersBoard');
                }}
                onNewGame={game => {
                  setSelectedGame(game);
                  setPendingGameId(game.id);
                  setAuthScreen('waitingRoom');
                }}
              />
            ) : (
              <ProfileScreen
                user={session}
                onLogout={handleLogout}
                onEditUsername={() => setAuthScreen('editUsername')}
                onEditEmail={() => setAuthScreen('editEmail')}
                onAvatarChanged={url => updateSession({avatarUrl: url})}
              />
            )}
          </View>
          <BottomTabBar active={tab} onPress={setTab} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Unauthenticated screens
  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {screen === 'login' && (
        <LoginScreen
          onCodeSent={email => {
            setPendingEmail(email);
            setScreen('verifyLogin');
          }}
          onNavigateToRegister={() => setScreen('register')}
        />
      )}

      {screen === 'register' && (
        <RegisterScreen
          onRegistered={email => {
            setPendingEmail(email);
            setScreen('confirmEmail');
          }}
          onNavigateToLogin={() => setScreen('login')}
        />
      )}

      {screen === 'confirmEmail' && (
        <ConfirmEmailScreen
          email={pendingEmail}
          onConfirmed={() => setScreen('login')}
          onNavigateToLogin={() => setScreen('login')}
          onResendCode={() => resendConfirmation({email: pendingEmail})}
        />
      )}

      {screen === 'verifyLogin' && (
        <ConfirmEmailScreen
          email={pendingEmail}
          heading={'Confirme\nseu acesso'}
          onConfirmed={() => setScreen('login')}
          onNavigateToLogin={() => setScreen('login')}
          onResendCode={async () => {
            await login({identifier: pendingEmail});
          }}
          onSubmitCode={async code => {
            const data = await verifyLogin({email: pendingEmail, code});
            handleLogin(data);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {backgroundColor: colors.bg},
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {flex: 1, backgroundColor: colors.bg},
  tabContent: {flex: 1},
});
