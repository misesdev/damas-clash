/**
 * PlayerMatchup — reusable two-player header chip row.
 *
 * Used in CheckersBoardScreen (live game) and ReplayScreen.
 * Shows avatar + piece-color dot + label + username + piece count for each
 * player. The active chip (whose turn it is) gets a highlighted border.
 */

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Avatar} from './chat/Avatar';
import {colors} from '../theme/colors';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PlayerInfo {
  username: string | null;
  avatarUrl: string | null;
  /** Short role label — e.g. "VOCÊ", "ADVERSÁRIO", "PRETO", "BRANCO" */
  label: string;
  count: number;
  isActive: boolean;
  pieceColor: 'dark' | 'light';
}

interface Props {
  left: PlayerInfo;
  right: PlayerInfo;
  /** Optional content between the two chips (e.g. watcher count, VS badge). */
  center?: React.ReactNode;
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function PlayerChip({player}: {player: PlayerInfo}) {
  return (
    <View
      style={[styles.chip, player.isActive && styles.chipActive]}
      testID={`player-chip-${player.pieceColor}`}>
      <Avatar username={player.username ?? '?'} avatarUrl={player.avatarUrl} size={28} />
      <View style={styles.chipInfo}>
        <View style={styles.chipLabelRow}>
          <View
            style={[
              styles.pieceDot,
              player.pieceColor === 'dark' ? styles.pieceDotDark : styles.pieceDotLight,
            ]}
          />
          <Text style={styles.chipLabel}>{player.label}</Text>
        </View>
        <Text style={styles.chipName} numberOfLines={1}>
          {player.username ?? '—'}
        </Text>
      </View>
      <Text style={styles.chipCount}>{player.count}</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerMatchup({left, right, center}: Props) {
  return (
    <View style={styles.row}>
      <PlayerChip player={left} />
      {center != null && <View style={styles.center}>{center}</View>}
      <PlayerChip player={right} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },

  // ── Chip ──────────────────────────────────────────────────────────────────
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  chipActive: {
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 0},
    elevation: 3,
  },
  chipInfo: {flex: 1, minWidth: 0},
  chipLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },

  // ── Piece color indicator ─────────────────────────────────────────────────
  pieceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0.5,
  },
  pieceDotDark: {
    backgroundColor: '#1A1A2A',
    borderColor: '#34344A',
  },
  pieceDotLight: {
    backgroundColor: '#F7F0E3',
    borderColor: '#C9B99A',
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  chipLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chipName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  chipCount: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 0,
    minWidth: 20,
    textAlign: 'right',
  },

  // ── Center slot ───────────────────────────────────────────────────────────
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
