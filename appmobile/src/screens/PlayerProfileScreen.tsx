import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
// Image is used inside PlayerAvatar (large avatar at top)
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ScreenHeader} from '../components/ScreenHeader';
import {GameHistoryCard} from '../components/GameHistoryCard';
import {ReplayScreen} from './ReplayScreen';
import {getPlayerGames, getPlayerStats} from '../api/games';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';
import type {GameResponse, PlayerStats} from '../types/game';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  session: LoginResponse;
  profilePlayerId: string;
  profileUsername: string;
  profileAvatarUrl?: string | null;
  onBack: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlayerAvatar({
  username,
  avatarUrl,
  size = 80,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        source={{uri: avatarUrl}}
        style={{width: size, height: size, borderRadius: size / 2}}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surfaceRaised,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{color: colors.text, fontSize: size * 0.35, fontWeight: '800'}}>
        {username.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

function StatCard({label, value}: {label: string; value: number | string}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function PlayerProfileScreen({
  session,
  profilePlayerId,
  profileUsername,
  profileAvatarUrl,
  onBack,
}: Props) {
  const {t} = useTranslation();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [replayGame, setReplayGame] = useState<GameResponse | null>(null);

  useEffect(() => {
    Promise.all([
      getPlayerStats(session.token, profilePlayerId),
      getPlayerGames(session.token, profilePlayerId),
    ])
      .then(([s, g]) => {
        setStats(s);
        setGames(g.filter(game => game.status === 'Completed'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session.token, profilePlayerId]);

  if (replayGame) {
    return (
      <ReplayScreen
        game={replayGame}
        session={session}
        onBack={() => setReplayGame(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={loading ? [] : games}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader title={t('playerProfile.title')} onBack={onBack} />

            {/* Avatar + name */}
            <View style={styles.header}>
              <PlayerAvatar
                username={profileUsername}
                avatarUrl={profileAvatarUrl}
                size={88}
              />
              <Text style={styles.username}>{profileUsername}</Text>
            </View>

            {/* Stats */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.text} />
              </View>
            ) : (
              <View style={styles.statsRow}>
                <StatCard label={t('playerProfile.stats.games')} value={stats?.total ?? 0} />
                <StatCard label={t('playerProfile.stats.wins')} value={stats?.wins ?? 0} />
                <StatCard label={t('playerProfile.stats.losses')} value={stats?.losses ?? 0} />
              </View>
            )}

            {/* History title */}
            {!loading && (
              <Text style={styles.sectionTitle}>{t('playerProfile.historyTitle')}</Text>
            )}

            {!loading && games.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>♟</Text>
                <Text style={styles.emptyText}>{t('playerProfile.historyEmpty')}</Text>
              </View>
            )}
          </View>
        }
        renderItem={({item}) => (
          <GameHistoryCard
            game={item}
            playerId={profilePlayerId}
            onReplay={setReplayGame}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  username: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 38,
    opacity: 0.4,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  separator: {
    height: 10,
  },
});
