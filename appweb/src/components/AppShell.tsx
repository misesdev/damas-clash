'use client';

import { login, resendConfirmation, verifyLogin } from '../api/auth';
import { BoardMark } from './BoardMark';
import { MessageBoxProvider } from './MessageBox';
import { CheckersBoardScreen } from '../screens/CheckersBoardScreen';
import { ConfirmEmailScreen } from '../screens/ConfirmEmailScreen';
import { EditEmailScreen } from '../screens/EditEmailScreen';
import { EditUsernameScreen } from '../screens/EditUsernameScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { WaitingRoomScreen } from '../screens/WaitingRoomScreen';
import { useApp } from '../hooks/useApp';

type TabName = 'home' | 'profile';

function TopNav({
  active,
  onPress,
  onNewGame,
  creating,
  username,
  avatarUrl,
}: {
  active: TabName;
  onPress: (t: TabName) => void;
  onNewGame: () => void;
  creating?: boolean;
  username?: string;
  avatarUrl?: string | null;
}) {
  const initials = username ? username.slice(0, 2).toUpperCase() : '?';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 60,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
        gap: 16,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <BoardMark size={22} />
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 3, color: 'var(--text)' }}>
          DAMAS
        </span>
      </div>

      {/* Nav tabs */}
      <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
        <NavTab label="Partidas" active={active === 'home'} onClick={() => onPress('home')} />
        <NavTab label="Perfil" active={active === 'profile'} onClick={() => onPress('profile')} />
      </nav>

      {/* Right side: user + new game */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {initials}
              </div>
            )}
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-muted)',
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {username}
            </span>
          </div>
        )}

        <button
          onClick={onNewGame}
          disabled={creating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 16px',
            background: 'var(--text)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: creating ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          {creating ? (
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid var(--bg)',
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : (
            <>
              <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>+</span>
              <span className="hidden sm:inline">Nova Partida</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

function NavTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        background: active ? 'var(--surface2)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-muted)',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function MobileTabBar({
  active,
  onPress,
  onNewGame,
  creating,
}: {
  active: TabName;
  onPress: (t: TabName) => void;
  onNewGame: () => void;
  creating?: boolean;
}) {
  return (
    <div
      className="flex md:hidden items-center justify-around px-2 py-2"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        minHeight: 64,
      }}
    >
      <button
        onClick={() => onPress('home')}
        className="flex flex-1 flex-col items-center gap-1 py-2"
        style={{ color: active === 'home' ? 'var(--text)' : 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 20 }}>⊞</span>
        <span style={{ fontSize: 10, fontWeight: 600 }}>Partidas</span>
      </button>

      <div className="flex flex-1 justify-center">
        <button
          onClick={onNewGame}
          disabled={creating}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--text)',
            color: 'var(--bg)',
            border: 'none',
            fontSize: 20,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: creating ? 0.5 : 1,
          }}
        >
          {creating ? (
            <span
              style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px solid var(--bg)',
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : '+'}
        </button>
      </div>

      <button
        onClick={() => onPress('profile')}
        className="flex flex-1 flex-col items-center gap-1 py-2"
        style={{ color: active === 'profile' ? 'var(--text)' : 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 20 }}>◉</span>
        <span style={{ fontSize: 10, fontWeight: 600 }}>Perfil</span>
      </button>
    </div>
  );
}

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

  // Full-screen screens (no sidebar/tabs)
  const isFullScreen = authScreen === 'checkersBoard' || authScreen === 'waitingRoom';

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

      // Main tab layout
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: "100%" }}>
          {/* Desktop top nav */}
          <div className="hidden md:block">
            <TopNav
              active={tab as TabName}
              onPress={setTab as (t: TabName) => void}
              onNewGame={handleNewGame}
              creating={creatingGame}
              username={session.username}
              avatarUrl={session.avatarUrl}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
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

          {/* Mobile bottom tab bar */}
          <MobileTabBar
            active={tab as TabName}
            onPress={setTab as (t: TabName) => void}
            onNewGame={handleNewGame}
            creating={creatingGame}
          />
        </div>
      );
    }

    // Unauthenticated
    if (screen === 'landing') {
      return <LandingScreen onPlay={() => setScreen('login')} />;
    }

    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        {screen === 'login' && (
          <LoginScreen
            onCodeSent={email => { setPendingEmail(email); setScreen('verifyLogin'); }}
            onNavigateToRegister={() => setScreen('register')}
          />
        )}
        {screen === 'register' && (
          <RegisterScreen
            onRegistered={email => { setPendingEmail(email); setScreen('confirmEmail'); }}
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
            onResendCode={async () => { await login({ identifier: pendingEmail }); }}
            onSubmitCode={async code => {
              const data = await verifyLogin({ email: pendingEmail, code });
              handleLogin(data);
            }}
          />
        )}
      </div>
    );
  };

  const isLanding = !session && screen === 'landing';

  return (
    <MessageBoxProvider>
      <div
        style={{
          height: isLanding ? 'auto' : '100dvh',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: isLanding ? 'visible' : 'hidden',
          background: 'var(--bg)',
        }}
      >
        {/* Board / waiting room: full screen without nav */}
        {session && isFullScreen ? (
          renderContent()
        ) : isLanding ? (
          renderContent()
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {renderContent()}
          </div>
        )}
      </div>
    </MessageBoxProvider>
  );
}
