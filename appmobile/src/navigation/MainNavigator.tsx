import React from 'react';
import {View, StyleSheet} from 'react-native';
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
import {EditLightningAddressScreen} from '../screens/profile/EditLightningAddressScreen';
import {CreateGameModal} from '../components/CreateGameModal';
import {colors} from '../theme/colors';
import {useAppContext} from '../context/AppContext';

export function MainNavigator() {
  const {
    authScreen,
    tab,
    setTab,
    session,
    selectedGame,
    pendingGameId,
    setPendingGameId,
    creatingGame,
    liveGames,
    onlineCount,
    replayGame,
    handleNewGame,
    handleCancelWaitingRoom,
    handleWaitingRoomBack,
    handleGameSelect,
    handleBackFromBoard,
    handleNavigateToEditUsername,
    handleNavigateToEditEmail,
    handleBackToProfile,
    handleOpenHistory,
    handleBackFromHistory,
    handleOpenReplay,
    handleBackFromReplay,
    handleLogout,
    updateSession,
    setShowOnlinePlayers,
    wallet,
    walletLoading,
    showCreateModal,
    setShowCreateModal,
    handleConfirmCreateGame,
    handleOpenDeposit,
    handleOpenWithdraw,
    handleOpenEditLightningAddress,
    handleBackFromWallet,
    handleLightningAddressSaved,
    lightningAddress,
  } = useAppContext();

  if (!session) {
    return null;
  }

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

  if (authScreen === 'deposit') {
    return (
      <DepositScreen
        user={session}
        onBack={handleBackFromWallet}
        onSuccess={handleBackFromWallet}
      />
    );
  }

  if (authScreen === 'withdraw') {
    return (
      <WithdrawScreen
        user={session}
        wallet={wallet}
        lightningAddress={lightningAddress}
        onBack={handleBackFromWallet}
        onSuccess={handleBackFromWallet}
        onRegisterLightningAddress={handleOpenEditLightningAddress}
      />
    );
  }

  if (authScreen === 'editLightningAddress') {
    return (
      <EditLightningAddressScreen
        user={session}
        initialAddress={lightningAddress}
        onSaved={handleLightningAddressSaved}
        onBack={handleBackToProfile}
      />
    );
  }

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
              if (pendingGameId === gameId) {
                setPendingGameId(null);
              }
            }}
            onOpenOnlinePlayers={() => setShowOnlinePlayers(true)}
            onDeposit={handleOpenDeposit}
            onWithdraw={handleOpenWithdraw}
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

const styles = StyleSheet.create({
  tabContainer: {flex: 1, backgroundColor: colors.bg},
  tabContent: {flex: 1},
});
