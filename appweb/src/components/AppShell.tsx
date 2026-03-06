'use client';

import { login, resendConfirmation, verifyLogin } from '../api/auth';
import { BoardMark } from './BoardMark';
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

type TabName = 'home' | 'profile';

function SidebarNav({
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
    <aside
      className="hidden md:flex flex-col h-full"
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <BoardMark size={28} />
        <span className="text-base font-bold tracking-widest text-white">DAMAS</span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        <NavItem
          icon="⊞"
          label="Partidas"
          active={active === 'home'}
          onClick={() => onPress('home')}
        />
        <NavItem
          icon="◉"
          label="Perfil"
          active={active === 'profile'}
          onClick={() => onPress('profile')}
        />
      </nav>

      {/* User + New Game */}
      <div className="p-3 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onNewGame}
          disabled={creating}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--text)', color: 'var(--bg)' }}
        >
          {creating ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <>
              <span className="text-base font-bold">+</span> Nova Partida
            </>
          )}
        </button>

        {username && (
          <div className="flex items-center gap-2 px-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--surface2)', color: 'var(--text)' }}
              >
                {initials}
              </div>
            )}
            <span className="text-sm font-medium text-white truncate">{username}</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
      style={{
        background: active ? 'var(--surface2)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-muted)',
      }}
    >
      <span className="text-base">{icon}</span>
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
        style={{ color: active === 'home' ? 'var(--text)' : 'var(--text-muted)' }}
      >
        <span className="text-xl">⊞</span>
        <span className="text-[10px] font-medium">Partidas</span>
      </button>

      <div className="flex flex-1 justify-center">
        <button
          onClick={onNewGame}
          disabled={creating}
          className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--text)', color: 'var(--bg)' }}
        >
          {creating ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : '+'}
        </button>
      </div>

      <button
        onClick={() => onPress('profile')}
        className="flex flex-1 flex-col items-center gap-1 py-2"
        style={{ color: active === 'profile' ? 'var(--text)' : 'var(--text-muted)' }}
      >
        <span className="text-xl">◉</span>
        <span className="text-[10px] font-medium">Perfil</span>
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
        <div className="flex h-full">
          {/* Desktop sidebar */}
          <SidebarNav
            active={tab as TabName}
            onPress={setTab as (t: TabName) => void}
            onNewGame={handleNewGame}
            creating={creatingGame}
            username={session.username}
            avatarUrl={session.avatarUrl}
          />

          {/* Content + mobile tab bar */}
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
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
            <MobileTabBar
              active={tab as TabName}
              onPress={setTab as (t: TabName) => void}
              onNewGame={handleNewGame}
              creating={creatingGame}
            />
          </div>
        </div>
      );
    }

    // Unauthenticated
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

  return (
    <MessageBoxProvider>
      <div
        className="flex flex-col overflow-hidden"
        style={{
          height: '100dvh',
          background: 'var(--bg)',
          // No max-width — full viewport on desktop
        }}
      >
        {/* Board / waiting room: full screen without nav */}
        {session && isFullScreen ? (
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
