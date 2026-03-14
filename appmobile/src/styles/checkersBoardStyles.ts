import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 48,
  },

  // ─── Top section (score row) ───────────────────────────────────────────────
  topSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scoreRow: {flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%'},
  playerChip: {
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
  activeChip: {
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 0},
    elevation: 3,
  },
  chipInfo: {flex: 1, minWidth: 0},
  chipLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    //textTransform: 'uppercase',
  },
  chipName: {color: colors.text, fontSize: 12, fontWeight: '600'},
  chipCount: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 0,
    minWidth: 20,
    textAlign: 'right',
  },

    onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  
  vsText: {color: colors.textMuted, fontSize: 12, fontWeight: '600'},

  // ─── Board section (centered) ──────────────────────────────────────────────
  boardSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 6,
  },
  errorText: {color: colors.error, fontSize: 12, textAlign: 'center'},

  // Status + timer row (below board)
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    flexShrink: 1,
    textAlign: 'center',
  },
  statusUrgent: {color: colors.error},
  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerBadgeUrgent: {
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderColor: colors.error,
  },
  timerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {color: colors.error},

  // ─── Board frame (wooden border) ──────────────────────────────────────────
  boardFrame: {
    borderRadius: 16,
    padding: 8,
    backgroundColor: '#1C0F05',
    borderWidth: 3,
    borderColor: '#3D1F0A',
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 20,
    elevation: 16,
  },
  board: {borderRadius: 8, overflow: 'hidden'},
  boardFlipped: {transform: [{scaleX: -1}, {scaleY: -1}]},

  // Cell grid layer
  cellGrid: {flexDirection: 'row', flexWrap: 'wrap'},

  // Individual cells — warmer classic palette
  lightCell: {backgroundColor: '#EDCFA1', alignItems: 'center', justifyContent: 'center'},
  darkCell: {backgroundColor: '#8B5E3C', alignItems: 'center', justifyContent: 'center'},
  selectedCell: {backgroundColor: '#C9D86A'},

  // Move indicators
  targetDot: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  captureRing: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(230, 60, 60, 0.75)',
  },

  // ─── Piece ────────────────────────────────────────────────────────────────
  piece: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 5,
    shadowOpacity: 0.55,
    elevation: 6,
  },
  // Dark piece: deep charcoal
  darkPiece: {
    backgroundColor: '#1A1A2A',
    borderColor: '#34344A',
    shadowColor: '#000',
  },
  // Light piece: warm ivory
  lightPiece: {
    backgroundColor: '#F7F0E3',
    borderColor: '#C9B99A',
    shadowColor: '#6B4F2A',
  },
  selectedPiece: {
    borderColor: '#E8B84B',
    shadowColor: '#E8B84B',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 12,
  },

  // Shine highlight inside piece
  pieceShine: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: '45%',
    aspectRatio: 1,
    borderRadius: 999,
  },
  darkShine: {backgroundColor: 'rgba(255,255,255,0.08)'},
  lightShine: {backgroundColor: 'rgba(255,255,255,0.55)'},

  // Crown
  crown: {fontSize: 14, lineHeight: 16, fontWeight: '800'},
  darkCrown: {color: '#D4AF37'},
  lightCrown: {color: '#7B5218'},

  // Selection ring (outside piece)
  selectionRing: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#E8B84B',
  },
  // Mandatory-capture ring
  mandatoryRing: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#E05050',
  },

  // ─── Chat section ──────────────────────────────────────────────────────────
  chatSection: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  chatList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chatEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  chatEmptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },

  // Message rows — same pattern as ChatScreen
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  msgRowMe: {justifyContent: 'flex-end'},
  msgBubble: {
    maxWidth: '75%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 11,
    paddingTop: 6,
    paddingBottom: 5,
  },
  msgBubbleMe: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  msgUsername: {
    color: '#5B9EF5',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  msgTime: {
    color: colors.textMuted,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 3,
  },

  // ─── Resign / Leave bar (above input) ─────────────────────────────────────
  resignBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  resignPill: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.error,
  },
  resignPillText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  leavePill: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leavePillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // ─── Win / loss overlay ───────────────────────────────────────────────────
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
    lineHeight: 22,
  },
  overlayActions: {marginTop: 8, width: '100%'},
});
