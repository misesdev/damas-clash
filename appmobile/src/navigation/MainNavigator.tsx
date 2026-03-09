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
              if (pendingGameId === gameId) {
                setPendingGameId(null);
              }
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

const styles = StyleSheet.create({
  tabContainer: {flex: 1, backgroundColor: colors.bg},
  tabContent: {flex: 1},
});
