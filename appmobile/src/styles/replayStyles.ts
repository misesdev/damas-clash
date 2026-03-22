import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const replayStyles = StyleSheet.create({
  // ── Root ──────────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  wrapper: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    paddingTop: 5,
    gap: 16,
  },

  // ── Move counter ──────────────────────────────────────────────────────────
  moveCounter: {
    color: colors.textMuted,
    fontSize: 13,
  },

  // ── Winner banner ─────────────────────────────────────────────────────────
  winnerBanner: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(46,204,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.3)',
  },
  winnerText: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Board frame ───────────────────────────────────────────────────────────
  boardFrame: {
    backgroundColor: '#2e1a0a',
    borderRadius: 14,
    padding: 8,
    borderWidth: 2,
    borderColor: '#5a3515',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  boardInner: {
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },

  // ── Piece ─────────────────────────────────────────────────────────────────
  pieceView: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  pieceDark: {
    backgroundColor: '#1a1e2a',
    borderColor: '#555',
  },
  pieceLight: {
    backgroundColor: '#e8e8e8',
    borderColor: '#999',
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // ── Controls ─────────────────────────────────────────────────────────────
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#131313',
    borderWidth: 1,
    borderColor: '#232323',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnPrimary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnDisabled: {
    opacity: 0.3,
  },
  controlBtnText: {
    color: colors.text,
    fontSize: 14,
  },
  controlBtnPrimaryText: {
    color: colors.background,
    fontSize: 18,
  },

  // ── Progress bar ──────────────────────────────────────────────────────────
  progressTrack: {
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text,
    borderRadius: 2,
  },
});
