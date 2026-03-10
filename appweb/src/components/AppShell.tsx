'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { login, resendConfirmation, verifyLogin } from '../api/auth';
import { BoardMark } from './BoardMark';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MessageBoxProvider } from './MessageBox';
import { CheckersBoardScreen } from '../screens/CheckersBoardScreen';
import { ConfirmEmailScreen } from '../screens/ConfirmEmailScreen';
import { EditEmailScreen } from '../screens/EditEmailScreen';
import { EditUsernameScreen } from '../screens/EditUsernameScreen';
import { GameHistoryScreen } from '../screens/GameHistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ReplayScreen } from '../screens/ReplayScreen';
import { WaitingRoomScreen } from '../screens/WaitingRoomScreen';
import { useApp } from '../hooks/useApp';
import { OnlinePlayersModal } from './OnlinePlayersModal';
import '../i18n';

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
  const { t } = useTranslation();
  const initials = username ? username.slice(0, 2).toUpperCase() : '?';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 56,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
        gap: 8,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <BoardMark size={20} />
        <span className="hidden lg:inline" style={{ fontWeight: 800, fontSize: 13, letterSpacing: 3, color: 'var(--text)' }}>
          DAMAS CLASH
        </span>
      </div>

      {/* Nav tabs */}
      <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
        <NavTab label={t('nav_games')} active={active === 'home'} onClick={() => onPress('home')} />
        <NavTab label={t('nav_profile')} active={active === 'profile'} onClick={() => onPress('profile')} />
      </nav>

      {/* Right side: language switcher + user + new game */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <LanguageSwitcher />

        {username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
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
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}
            <span
              className="hidden lg:inline"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-muted)',
                maxWidth: 110,
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
            padding: '7px 14px',
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
              <span className="hidden lg:inline">{t('nav_newGame')}</span>
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
  const { t } = useTranslation();

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
        <span style={{ fontSize: 10, fontWeight: 600 }}>{t('nav_games')}</span>
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
        <span style={{ fontSize: 10, fontWeight: 600 }}>{t('nav_profile')}</span>
      </button>
    </div>
  );
}

export function AppShell() {
  const { t } = useTranslation();
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
    handleChallengePlayer,
    handleCancelChallenge,
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
  } = useApp();

  // Full-screen screens (no sidebar/tabs)
  const isFullScreen = authScreen === 'checkersBoard' || authScreen === 'waitingRoom' || authScreen === 'gameHistory' || authScreen === 'replay';

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
                onlineCount={onlineCount}
                onGameSelect={handleGameSelect}
                onGameCancelled={gameId => {
                  if (pendingGameId === gameId) setPendingGameId(null);
                }}
                onOpenOnlinePlayers={() => setShowOnlinePlayers(true)}
              />
            ) : (
              <ProfileScreen
                user={session}
                onLogout={handleLogout}
                onEditUsername={handleNavigateToEditUsername}
                onEditEmail={handleNavigateToEditEmail}
                onAvatarChanged={url => updateSession({ avatarUrl: url })}
                onOpenHistory={handleOpenHistory}
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
            onGoogleLogin={handleLogin}
          />
        )}
        {screen === 'register' && (
          <RegisterScreen
            onRegistered={email => { setPendingEmail(email); setScreen('confirmEmail'); }}
            onNavigateToLogin={() => setScreen('login')}
            onGoogleLogin={handleLogin}
          />
        )}
        {screen === 'confirmEmail' && (
          <ConfirmEmailScreen
            email={pendingEmail}
            onConfirmed={data => { if (data) { handleLogin(data); } else { setScreen('login'); } }}
            onNavigateToLogin={() => setScreen('login')}
            onResendCode={() => resendConfirmation({ email: pendingEmail })}
          />
        )}
        {screen === 'verifyLogin' && (
          <ConfirmEmailScreen
            email={pendingEmail}
            heading={t('confirm_verifyLogin')}
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

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
    <MessageBoxProvider>
      {session && showOnlinePlayers && (
        <OnlinePlayersModal
          players={onlinePlayers}
          currentPlayerId={session.playerId}
          pendingChallengeId={pendingChallengeId}
          onClose={() => setShowOnlinePlayers(false)}
          onChallenge={handleChallengePlayer}
          onCancelChallenge={handleCancelChallenge}
          onWatch={handleWatchOnlineGame}
        />
      )}
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
    </GoogleOAuthProvider>
  );
}
