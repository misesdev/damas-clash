import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';

interface PlayerInfo {
  username: string | null;
  avatarUrl: string | null;
}

interface Props {
  left: PlayerInfo;
  right: PlayerInfo;
  /** Secondary line shown below the names (e.g. bet label) */
  detail?: string;
  avatarSize?: number;
  /** Highlights the winner's name; 'draw' dims both equally */
  winnerSide?: 'left' | 'right' | 'draw';
}

function Avatar({username, avatarUrl, size}: {username: string | null; avatarUrl: string | null; size: number}) {
  const initials = (username ?? '?').slice(0, 2).toUpperCase();
  const style = {width: size, height: size, borderRadius: size / 2} as const;

  if (avatarUrl) {
    return <Image source={{uri: avatarUrl}} style={[styles.avatar, style]} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback, style]}>
      <Text style={[styles.avatarInitials, {fontSize: size * 0.38}]}>{initials}</Text>
    </View>
  );
}

export function PlayerVs({left, right, detail, avatarSize = 26, winnerSide}: Props) {
  const leftNameColor =
    winnerSide === 'left' ? '#2ecc71' :
    winnerSide === 'right' ? colors.textMuted :
    winnerSide === 'draw' ? colors.textSecondary :
    colors.text;

  const rightNameColor =
    winnerSide === 'right' ? '#2ecc71' :
    winnerSide === 'left' ? colors.textMuted :
    winnerSide === 'draw' ? colors.textSecondary :
    colors.text;

  return (
    <View style={styles.container}>
      <View style={styles.names}>
        {/* Left player */}
        <View style={styles.playerSide}>
          <Avatar username={left.username} avatarUrl={left.avatarUrl} size={avatarSize} />
          <Text style={[styles.playerName, {color: leftNameColor}]} numberOfLines={1} ellipsizeMode="tail">
            {left.username ?? '—'}
          </Text>
        </View>

        {/* vs */}
        <Text style={styles.vs}>vs</Text>

        {/* Right player */}
        <View style={[styles.playerSide, styles.playerSideRight]}>
          <Text style={[styles.playerName, styles.playerNameRight, {color: rightNameColor}]} numberOfLines={1} ellipsizeMode="tail">
            {right.username ?? '—'}
          </Text>
          <Avatar username={right.username} avatarUrl={right.avatarUrl} size={avatarSize} />
        </View>
      </View>

      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
  },
  names: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  playerSideRight: {
    justifyContent: 'flex-end',
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  playerNameRight: {
    textAlign: 'right',
  },
  vs: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatar: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarFallback: {
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  detail: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
