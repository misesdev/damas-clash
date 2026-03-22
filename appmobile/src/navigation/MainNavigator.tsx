import React from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {BottomTabBar} from '../components/BottomTabBar';
import {CheckersBoardScreen} from '../screens/CheckersBoardScreen';
import {EditEmailScreen} from '../screens/EditEmailScreen';
import {EditUsernameScreen} from '../screens/EditUsernameScreen';
import {GameHistoryScreen} from '../screens/GameHistoryScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {ReplayScreen} from '../screens/ReplayScreen';
import {WaitingRoomScreen} from '../screens/WaitingRoomScreen';
import {DepositScreen} from '../screens/wallet/DepositScreen';
import {WithdrawScreen} from '../screens/wallet/WithdrawScreen';
import {WalletHistoryScreen} from '../screens/wallet/WalletHistoryScreen';
import {EditLightningAddressScreen} from '../screens/profile/EditLightningAddressScreen';
import {PlayerProfileScreen} from '../screens/PlayerProfileScreen';
import {DashboardScreen} from '../screens/DashboardScreen';
import {ChatScreen} from '../screens/ChatScreen';
import {CreateGameModal} from '../components/CreateGameModal';
import {colors} from '../theme/colors';
import {useAppContext} from '../context/AppContext';
import {useAndroidBack} from './useAndroidBack';
import type {AuthScreen} from '../hooks/useApp';
import type {ReactElement} from 'react';
import { showMessage } from '../components/MessageBox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScreenDef {
  render: () => ReactElement | null;
  onBack: () => void;
}

// ─── Tabs view (home + profile) ───────────────────────────────────────────────

function TabsView() {
  const {
    session,
    tab,
    setTab,
    selectedGame,
    pendingGameId,
    setPendingGameId,
    creatingGame,
    liveGames,
    onlineCount,
    wallet,
    walletLoading,
    showCreateModal,
    setShowCreateModal,
    lightningAddress,
    handleNewGame,
    handleGameSelect,
    handleConfirmCreateGame,
    handleNavigateToEditUsername,
    handleNavigateToEditEmail,
    handleOpenHistory,
    handleLogout,
    updateSession,
    setShowOnlinePlayers,
    handleOpenDeposit,
    handleOpenWithdraw,
    handleOpenDashboard,
    handleOpenChat,
    handleOpenEditLightningAddress,
    onlinePlayers,
    hasChatUnread,
  } = useAppContext();

  if (!session) {return null;}

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabContent}>
        {tab === 'home' ? (
          <HomeScreen
            user={session}
            pendingGame={pendingGameId ? selectedGame : null}
            liveGames={liveGames}
            onlineCount={onlineCount}
            wallet={wallet}
            walletLoading={walletLoading}
            onGameSelect={handleGameSelect}
            onGameCancelled={gameId => {
              if (pendingGameId === gameId) {setPendingGameId(null);}
            }}
            onOpenOnlinePlayers={() => setShowOnlinePlayers(true)}
            onDeposit={handleOpenDeposit}
            onWithdraw={handleOpenWithdraw}
            onOpenDashboard={handleOpenDashboard}
            onOpenChat={handleOpenChat}
            hasChatUnread={hasChatUnread}
          />
        ) : (
          <ProfileScreen
            user={session}
            onLogout={handleLogout}
            onEditUsername={handleNavigateToEditUsername}
            onEditEmail={handleNavigateToEditEmail}
            onAvatarChanged={url => updateSession({avatarUrl: url})}
            onOpenHistory={handleOpenHistory}
            lightningAddress={lightningAddress}
            onEditLightningAddress={handleOpenEditLightningAddress}
          />
        )}
      </View>
      <BottomTabBar
        active={tab}
        onPress={setTab}
        onNewGame={handleNewGame}
        creating={creatingGame}
      />
      <CreateGameModal
        visible={showCreateModal}
        wallet={wallet}
        creating={creatingGame}
        onConfirm={handleConfirmCreateGame}
        onClose={() => setShowCreateModal(false)}
      />
    </View>
  );
}

// ─── Main Navigator ───────────────────────────────────────────────────────────

export function MainNavigator() {
  const {t} = useTranslation();
  const {
    authScreen,
    tab,
    setTab,
    session,
    selectedGame,
    replayGame,
    selectedPlayerProfile,
    wallet,
    lightningAddress,
    handleWaitingRoomBack,
    handleCancelWaitingRoom,
    handleBackFromBoard,
    handleGameSelect,
    handleBackToProfile,
    handleOpenReplay,
    handleBackFromHistory,
    handleBackFromReplay,
    updateSession,
    handleBackFromWallet,
    handleBackFromPlayerProfile,
    handleLightningAddressSaved,
    handleBackFromDashboard,
    handleCloseChat,
    handleOpenEditLightningAddress,
    handleViewPlayerProfile,
    handleWatchOnlineGame,
    onlinePlayers,
  } = useAppContext();

  // ─── Screen registry ────────────────────────────────────────────────────────
  // Each entry pairs a render function with its back-navigation handler.
  // Adding a new screen = adding one entry here.

  const registry: Partial<Record<AuthScreen, ScreenDef>> = {
    waitingRoom: {
      render: () =>
        selectedGame ? (
          <WaitingRoomScreen
            game={selectedGame}
            onBack={handleWaitingRoomBack}
            onCancelGame={handleCancelWaitingRoom}
          />
        ) : null,
      onBack: handleWaitingRoomBack,
    },

    checkersBoard: {
      render: () =>
        session && selectedGame ? (
          <CheckersBoardScreen
            game={selectedGame}
            session={session}
            onBack={handleBackFromBoard}
          />
        ) : null,
      onBack: handleBackFromBoard,
    },

    gameHistory: {
      render: () =>
        session ? (
          <GameHistoryScreen
            user={session}
            onReplay={handleOpenReplay}
            onBack={handleBackFromHistory}
          />
        ) : null,
      onBack: handleBackFromHistory,
    },

    replay: {
      render: () =>
        session && replayGame ? (
          <ReplayScreen
            game={replayGame}
            session={session}
            onBack={handleBackFromReplay}
          />
        ) : null,
      onBack: handleBackFromReplay,
    },

    editUsername: {
      render: () =>
        session ? (
          <EditUsernameScreen
            user={session}
            onSaved={newUsername => {
              updateSession({username: newUsername});
              handleBackToProfile();
            }}
            onBack={handleBackToProfile}
          />
        ) : null,
      onBack: handleBackToProfile,
    },

    editEmail: {
      render: () =>
        session ? (
          <EditEmailScreen
            user={session}
            onSaved={newEmail => {
              updateSession({email: newEmail});
              handleBackToProfile();
            }}
            onBack={handleBackToProfile}
          />
        ) : null,
      onBack: handleBackToProfile,
    },

    deposit: {
      render: () =>
        session ? (
          <DepositScreen
            user={session}
            onBack={handleBackFromWallet}
            onSuccess={handleBackFromWallet}
          />
        ) : null,
      onBack: handleBackFromWallet,
    },

    withdraw: {
      render: () =>
        session ? (
          <WithdrawScreen
            user={session}
            wallet={wallet}
            lightningAddress={lightningAddress}
            onBack={handleBackFromWallet}
            onSuccess={handleBackFromWallet}
            onRegisterLightningAddress={handleOpenEditLightningAddress}
          />
        ) : null,
      onBack: handleBackFromWallet,
    },

    walletHistory: {
      render: () =>
        session ? (
          <WalletHistoryScreen user={session} onBack={handleBackFromWallet} />
        ) : null,
      onBack: handleBackFromWallet,
    },

    playerProfile: {
      render: () =>
        session && selectedPlayerProfile ? (
          <PlayerProfileScreen
            session={session}
            profilePlayerId={selectedPlayerProfile.playerId}
            profileUsername={selectedPlayerProfile.username}
            profileAvatarUrl={selectedPlayerProfile.avatarUrl}
            onBack={handleBackFromPlayerProfile}
          />
        ) : null,
      onBack: handleBackFromPlayerProfile,
    },

    editLightningAddress: {
      render: () =>
        session ? (
          <EditLightningAddressScreen
            user={session}
            initialAddress={lightningAddress}
            onSaved={handleLightningAddressSaved}
            onBack={handleBackToProfile}
          />
        ) : null,
      onBack: handleBackToProfile,
    },

    dashboard: {
      render: () =>
        session ? (
          <DashboardScreen session={session} onBack={handleBackFromDashboard} />
        ) : null,
      onBack: handleBackFromDashboard,
    },

    chat: {
      render: () =>
        session ? (
          <ChatScreen
            session={session}
            onlinePlayers={onlinePlayers}
            onBack={handleCloseChat}
            onViewProfile={handleViewPlayerProfile}
            onWatch={handleWatchOnlineGame}
          />
        ) : null,
      onBack: handleCloseChat,
    },
  };

  // ─── Android back button ────────────────────────────────────────────────────

  useAndroidBack(() => {
    if (authScreen === 'tabs') {
      if (tab === 'profile') {
        // Profile → Home
        setTab('home');
        return true;
      }
      // Home → confirm exit
      showMessage({
        title: t('app.exitTitle'),
        message: t('app.exitMessage'),
        type: 'confirm',
        actions: [
          {label: t('common.cancel')},
          {
            label: t('app.exitConfirm'), 
            danger: true, onPress: () => BackHandler.exitApp()
          },
        ],
      });
      return true;
    }

    const def = registry[authScreen];
    if (def) {
      def.onBack();
      return true;
    }

    return false;
  });

  // ─── Render current screen ──────────────────────────────────────────────────

  if (!session) {return null;}

  const def = registry[authScreen];
  if (def) {
    const el = def.render();
    if (el !== null) {return el;}
  }

  return <TabsView />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabContainer: {flex: 1, backgroundColor: colors.bg},
  tabContent: {flex: 1},
});
