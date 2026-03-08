import React from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {login, resendConfirmation, verifyLogin} from './src/api/auth';
import {BottomTabBar} from './src/components/BottomTabBar';
import MessageBox from './src/components/MessageBox';
import {CheckersBoardScreen} from './src/screens/CheckersBoardScreen';
import {ConfirmEmailScreen} from './src/screens/ConfirmEmailScreen';
import {EditEmailScreen} from './src/screens/EditEmailScreen';
import {EditUsernameScreen} from './src/screens/EditUsernameScreen';
import {GameHistoryScreen} from './src/screens/GameHistoryScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {ProfileScreen} from './src/screens/ProfileScreen';
import {RegisterScreen} from './src/screens/RegisterScreen';
import {ReplayScreen} from './src/screens/ReplayScreen';
import {WaitingRoomScreen} from './src/screens/WaitingRoomScreen';
import {OnlinePlayersScreen} from './src/screens/OnlinePlayersScreen';
import {useApp} from './src/hooks/useApp';
import {colors} from './src/theme/colors';

export default function App() {
  const {
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
    onlineCount,
    showOnlinePlayers,
    setShowOnlinePlayers,
    pendingChallengeId,
    handleNewGame,
    handleChallengePlayer,
    handleCancelChallenge,
    handleWatchOnlineGame,
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
  } = useApp();

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.splash}>
          <ActivityIndicator color={colors.text} />
        </View>
      );
    }

    if (session) {
      if (authScreen === 'waitingRoom' && selectedGame) {
        return (
          <WaitingRoomScreen
            game={selectedGame}
            onBack={handleWaitingRoomBack}
            onCancelGame={handleCancelWaitingRoom}
          />
        );
      }

      if (authScreen === 'checkersBoard' && selectedGame) {
        return (
          <CheckersBoardScreen
            game={selectedGame}
            session={session}
            onBack={handleBackFromBoard}
          />
        );
      }

      if (authScreen === 'gameHistory') {
        return (
          <GameHistoryScreen
            user={session}
            onReplay={handleOpenReplay}
            onBack={handleBackFromHistory}
          />
        );
      }

      if (authScreen === 'replay' && replayGame) {
        return (
          <ReplayScreen
            game={replayGame}
            session={session}
            onBack={handleBackFromReplay}
          />
        );
      }

      if (authScreen === 'editUsername') {
        return (
          <EditUsernameScreen
            user={session}
            onSaved={newUsername => {
              updateSession({username: newUsername});
              handleBackToProfile();
            }}
            onBack={handleBackToProfile}
          />
        );
      }

      if (authScreen === 'editEmail') {
        return (
          <EditEmailScreen
            user={session}
            onSaved={newEmail => {
              updateSession({email: newEmail});
              handleBackToProfile();
            }}
            onBack={handleBackToProfile}
          />
        );
      }

      // Tab layout
      return (
        <View style={styles.tabContainer}>
          <View style={styles.tabContent}>
            {tab === 'home' ? (
              <HomeScreen
                user={session}
                pendingGame={pendingGameId ? selectedGame : null}
                liveGames={liveGames}
                onlineCount={onlineCount}
                onGameSelect={handleGameSelect}
                onGameCancelled={gameId => {
                  if (pendingGameId === gameId) {setPendingGameId(null);}
                }}
                onOpenOnlinePlayers={() => setShowOnlinePlayers(true)}
              />
            ) : (
              <ProfileScreen
                user={session}
                onLogout={handleLogout}
                onEditUsername={handleNavigateToEditUsername}
                onEditEmail={handleNavigateToEditEmail}
                onAvatarChanged={url => updateSession({avatarUrl: url})}
                onOpenHistory={handleOpenHistory}
              />
            )}
          </View>
          <BottomTabBar
            active={tab}
            onPress={setTab}
            onNewGame={handleNewGame}
            creating={creatingGame}
          />
        </View>
      );
    }

    // Unauthenticated screens
    return (
      <View style={styles.root}>
        {screen === 'login' && (
          <LoginScreen
            onCodeSent={email => {
              setPendingEmail(email);
              setScreen('verifyLogin');
            }}
            onNavigateToRegister={() => setScreen('register')}
            onGoogleLogin={handleLogin}
          />
        )}

        {screen === 'register' && (
          <RegisterScreen
            onRegistered={email => {
              setPendingEmail(email);
              setScreen('confirmEmail');
            }}
            onNavigateToLogin={() => setScreen('login')}
            onGoogleLogin={handleLogin}
          />
        )}

        {screen === 'confirmEmail' && (
          <ConfirmEmailScreen
            email={pendingEmail}
            onConfirmed={data => { if (data) { handleLogin(data); } else { setScreen('login'); } }}
            onNavigateToLogin={() => setScreen('login')}
            onResendCode={() => resendConfirmation({email: pendingEmail})}
          />
        )}

        {screen === 'verifyLogin' && (
          <ConfirmEmailScreen
            email={pendingEmail}
            heading={'Confirme seu acesso'}
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
      </View>
    );
  };

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      {renderContent()}
      {/* MessageBox is always mounted so showMessage() works from any hook */}
      <MessageBox />
      {/* Online players modal — always mounted while logged in */}
      {session && (
        <OnlinePlayersScreen
          visible={showOnlinePlayers}
          onClose={() => setShowOnlinePlayers(false)}
          players={onlinePlayers}
          currentPlayerId={session.playerId}
          pendingChallengeId={pendingChallengeId}
          onChallenge={handleChallengePlayer}
          onCancelChallenge={handleCancelChallenge}
          onWatch={handleWatchOnlineGame}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.bg},
  root: {flex: 1, backgroundColor: colors.bg},
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {flex: 1, backgroundColor: colors.bg},
  tabContent: {flex: 1},
});
