import React, {useEffect, useRef} from 'react';
import {ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {colors} from '../theme/colors';
import type {GameResponse} from '../types/game';

function PulsingDot() {
  const ring = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {toValue: 2.2, duration: 800, useNativeDriver: true}),
        Animated.timing(ring, {toValue: 1, duration: 800, useNativeDriver: true}),
      ]),
    ).start();
  }, [ring]);
  return (
    <View style={styles.pulseWrapper}>
      <Animated.View style={[styles.pulseRing, {transform: [{scale: ring}]}]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

interface Props {
  game: GameResponse;
  currentPlayerId: string;
  onPress: () => void;
  onCancel?: () => void;
  loading?: boolean;
  cancelling?: boolean;
}

function PlayerAvatar({username, avatarUrl, size = 44}: {username: string | null; avatarUrl: string | null; size?: number}) {
  const initials = (username ?? '?').slice(0, 2).toUpperCase();
  const radius = size / 2;
  if (avatarUrl) {
    return (
      <Image
        source={{uri: avatarUrl}}
        style={[styles.avatar, {width: size, height: size, borderRadius: radius}]}
      />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback, {width: size, height: size, borderRadius: radius}]}>
      <Text style={[styles.avatarText, {fontSize: size * 0.34}]}>{initials}</Text>
    </View>
  );
}

export function GameCard({game, currentPlayerId, onPress, onCancel, loading, cancelling}: Props) {
  const {t} = useTranslation();
  const isCreator = game.playerBlackId === currentPlayerId;
  const isParticipant =
    isCreator || game.playerWhiteId === currentPlayerId;

  const creatorName = game.playerBlackUsername ?? t('gameCard.unknownCreator');

  const statusLabel = {
    WaitingForPlayers: t('gameCard.status.waiting'),
    InProgress: t('gameCard.status.inProgress'),
    Completed: t('gameCard.status.completed'),
  }[game.status];

  const statusColor = {
    WaitingForPlayers: '#4CAF50',
    InProgress: '#4CAF50',
    Completed: colors.textMuted,
  }[game.status];

  const isOwnPending = game.status === 'WaitingForPlayers' && isCreator;

  let actionLabel: string | null = null;
  if (game.status === 'WaitingForPlayers' && !isParticipant) {
    actionLabel = t('gameCard.actions.play');
  } else if (game.status === 'InProgress' && isParticipant) {
    actionLabel = t('gameCard.actions.play');
  } else if (game.status === 'InProgress' && !isParticipant) {
    actionLabel = t('gameCard.actions.watch');
  }

  return (
    <View style={styles.card}>
      <PlayerAvatar username={game.playerBlackUsername} avatarUrl={game.playerBlackAvatarUrl} />

      <View style={styles.info}>
        <Text style={styles.creator} numberOfLines={1}>{creatorName}</Text>
        <View style={styles.statusRow}>
          {game.status === 'WaitingForPlayers' ? (
            <PulsingDot />
          ) : (
            <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
          )}
          <Text style={[styles.status, {color: statusColor}]}>{statusLabel}</Text>
        </View>
        {game.betAmountSats > 0 ? (
          <View style={styles.betBadge}>
            <Text style={styles.betBadgeText}>⚡ {game.betAmountSats.toLocaleString()}</Text>
          </View>
        ) : (
          <View style={styles.friendlyBadge}>
            <Text style={styles.friendlyBadgeText}>{t('gameCard.friendly')}</Text>
          </View>
        )}
      </View>

      {isOwnPending && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          disabled={cancelling}
          testID={`cancel-game-${game.id}`}>
          {cancelling ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={styles.cancelText}>{t('gameCard.actions.cancel')}</Text>
          )}
        </TouchableOpacity>
      )}

      {actionLabel && (
        <TouchableOpacity style={styles.action} onPress={onPress} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.primaryText} size="small" />
          ) : (
            <Text style={styles.actionText}>{actionLabel}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatar: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarFallback: {
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: colors.text, fontWeight: '700'},
  info: {flex: 1},
  creator: {color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  statusDot: {width: 6, height: 6, borderRadius: 3},
  pulseWrapper: {width: 12, height: 12, alignItems: 'center', justifyContent: 'center'},
  pulseRing: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(76,175,80,0.35)',
  },
  pulseDot: {width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50'},
  status: {fontSize: 13},
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelText: {color: colors.error, fontWeight: '600', fontSize: 13},
  action: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  actionText: {color: colors.primaryText, fontWeight: '600', fontSize: 13},
  betBadge: {
    backgroundColor: 'rgba(255, 200, 0, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  betBadgeText: {color: '#FFC800', fontWeight: '700', fontSize: 11},
  friendlyBadge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  friendlyBadgeText: {color: colors.textMuted, fontWeight: '600', fontSize: 11},
});
