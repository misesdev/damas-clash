'use client';

import { login, resendConfirmation, verifyLogin } from '../api/auth';
import { BottomTabBar } from './BottomTabBar';
import { MessageBoxProvider } from './MessageBox';
import { CheckersBoardScreen } from '../screens/CheckersBoardScreen';
import { ConfirmEmailScreen } from '../screens/ConfirmEmailScreen';
import { EditEmailScreen } from '../screens/EditEmailScreen';
import { EditUsernameScreen } from '../screens/EditUsernameScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { WaitingRoomScreen } from '../screens/WaitingRoomScreen';
import { useApp } from '../hooks/useApp';

export function AppShell() {
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
    handleNewGame,
    handleCancelWaitingRoom,
    handleWaitingRoomBack,
    handleGameSelect,
    handleBackFromBoard,
    handleNavigateToEditUsername,
    handleNavigateToEditEmail,
    handleBackToProfile,
  } = useApp();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
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

      if (authScreen === 'editUsername') {
        return (
          <EditUsernameScreen
            user={session}
            onSaved={newUsername => {
              updateSession({ username: newUsername });
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
              updateSession({ email: newEmail });
              handleBackToProfile();
            }}
            onBack={handleBackToProfile}
          />
        );
      }

      // Tab layout
      return (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {tab === 'home' ? (
              <HomeScreen
                user={session}
                pendingGame={pendingGameId ? selectedGame : null}
                liveGames={liveGames}
                onGameSelect={handleGameSelect}
                onGameCancelled={gameId => {
                  if (pendingGameId === gameId) setPendingGameId(null);
                }}
              />
            ) : (
              <ProfileScreen
                user={session}
                onLogout={handleLogout}
                onEditUsername={handleNavigateToEditUsername}
                onEditEmail={handleNavigateToEditEmail}
                onAvatarChanged={url => updateSession({ avatarUrl: url })}
              />
            )}
          </div>
          <BottomTabBar
            active={tab}
            onPress={setTab}
            onNewGame={handleNewGame}
            creating={creatingGame}
          />
        </div>
      );
    }

    // Unauthenticated screens
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
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
            onResendCode={() => resendConfirmation({ email: pendingEmail })}
          />
        )}

        {screen === 'verifyLogin' && (
          <ConfirmEmailScreen
            email={pendingEmail}
            heading={'Confirme\nseu acesso'}
            onConfirmed={() => setScreen('login')}
            onNavigateToLogin={() => setScreen('login')}
            onResendCode={async () => {
              await login({ identifier: pendingEmail });
            }}
            onSubmitCode={async code => {
              const data = await verifyLogin({ email: pendingEmail, code });
              handleLogin(data);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <MessageBoxProvider>
      <div
        className="flex h-screen flex-col overflow-hidden"
        style={{ background: 'var(--bg)', maxWidth: 480, margin: '0 auto' }}
      >
        {renderContent()}
      </div>
    </MessageBoxProvider>
  );
}
