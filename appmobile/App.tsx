import './src/i18n';
import React from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import MessageBox from './src/components/MessageBox';
import {OnlinePlayersScreen} from './src/screens/OnlinePlayersScreen';
import {AppProvider, useAppContext} from './src/context/AppContext';
import {AuthNavigator} from './src/navigation/AuthNavigator';
import {MainNavigator} from './src/navigation/MainNavigator';
import {colors} from './src/theme/colors';

function AppContent() {
  const {
    session,
    loading,
    showOnlinePlayers,
    setShowOnlinePlayers,
    onlinePlayers,
    pendingChallengeId,
    handleChallengePlayer,
    handleCancelChallenge,
    handleWatchOnlineGame,
  } = useAppContext();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <>
      {session ? <MainNavigator /> : <AuthNavigator />}

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
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.safeArea}>
      <StatusBar backgroundColor={colors.bg} />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.bg},
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
