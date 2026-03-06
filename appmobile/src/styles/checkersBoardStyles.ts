import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 16,
  },

  // Header
  header: {alignItems: 'center', gap: 2},
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  watchers: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Status + timer row (below board)
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusUrgent: {color: colors.error},
  timerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
  },
  timerUrgent: {color: colors.error},

  // Score row
  scoreRow: {flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%'},
  playerChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  activeChip: {borderColor: colors.text},
  chipInfo: {flex: 1},
  chipLabel: {color: colors.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 0.3},
  chipName: {color: colors.text, fontSize: 12, fontWeight: '600'},
  chipCount: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 0,
  },
  vs: {color: colors.textMuted, fontSize: 14, fontWeight: '700'},
  errorText: {color: colors.error, fontSize: 12, textAlign: 'center'},
  winnerText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },

  // Board frame (wooden border effect)
  boardFrame: {
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#2E1A0A',
    borderWidth: 2,
    borderColor: '#5A3515',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 12,
  },
  board: {borderRadius: 6, overflow: 'hidden'},
  boardFlipped: {transform: [{scaleX: -1}, {scaleY: -1}]},

  // Cell grid layer
  cellGrid: {flexDirection: 'row', flexWrap: 'wrap'},

  // Individual cells
  lightCell: {backgroundColor: '#F0D9B5', alignItems: 'center', justifyContent: 'center'},
  darkCell: {backgroundColor: '#B58863', alignItems: 'center', justifyContent: 'center'},
  selectedCell: {backgroundColor: '#CDD16F'},

  // Move indicators
  targetDot: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  captureRing: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(220, 50, 50, 0.7)',
  },

  // Piece
  piece: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOpacity: 0.45,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 4,
    elevation: 5,
  },
  darkPiece: {backgroundColor: '#1E2230', borderColor: '#0D0F18', shadowColor: '#000'},
  lightPiece: {backgroundColor: '#F4EEE2', borderColor: '#C8BCA8', shadowColor: '#555'},
  selectedPiece: {
    borderColor: '#D4A843',
    shadowColor: '#D4A843',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },

  // Shine ring inside piece
  pieceShine: {
    position: 'absolute',
    top: '12%',
    left: '12%',
    width: '58%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  darkShine: {backgroundColor: '#2E364E', borderColor: '#3D4760'},
  lightShine: {backgroundColor: '#FFFFFF', borderColor: '#E0D8CC'},

  // Crown text
  crown: {fontSize: 13, lineHeight: 15, fontWeight: '700', marginTop: 2},
  darkCrown: {color: '#C9A84C'},
  lightCrown: {color: '#7A5A18'},

  // Selection glow ring (rendered in pieces layer, position: absolute)
  selectionRing: {position: 'absolute', borderWidth: 2.5, borderColor: '#D4A843'},

  // Win / loss overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  overlayContent: {alignItems: 'center', gap: 16},
  overlayEmoji: {fontSize: 64},
  overlayHeading: {fontSize: 32, fontWeight: '800', letterSpacing: 0.5},
  winColor: {color: colors.text},
  lossColor: {color: colors.textSecondary},
  overlaySubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  overlayActions: {marginTop: 8, width: '100%'},
});
