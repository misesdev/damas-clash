import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  // ─── Container ────────────────────────────────────────────────────────────
  container: {flex: 1, backgroundColor: colors.bg},

  // ─── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topBarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  adminText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: 30,
    backgroundColor: colors.text,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
  fabLiveSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fabLiveDotWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLiveDotRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(76, 175, 80, 0.35)',
  },
  fabLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CAF50',
  },
  fabLiveLabel: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  fabDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  fabChatText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
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

  // ─── Segment tabs ─────────────────────────────────────────────────────────
  segment: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentTabActive: {
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },

  // ─── Shared tab content wrapper ───────────────────────────────────────────
  tabContent: {
    flex: 1,
  },

  // ─── Wallet tab ───────────────────────────────────────────────────────────
  walletScroll: {
    paddingBottom: 40,
  },

  balanceCard: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  balanceLoader: {
    marginVertical: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  balanceAmount: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
    lineHeight: 56,
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 6,
  },
  lockedBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,193,7,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.25)',
  },
  lockedText: {
    fontSize: 12,
    color: '#FFC107',
    fontWeight: '500',
  },

  actionRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  actionIconPrimary: {
    color: colors.primaryText,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  actionLabelPrimary: {
    color: colors.primaryText,
  },

  txSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 12,
  },
  txSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  txList: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  txDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txIconPos: {backgroundColor: 'rgba(76, 175, 80, 0.15)'},
  txIconNeg: {backgroundColor: 'rgba(255, 69, 58, 0.12)'},
  txIconText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  txInfo: {flex: 1},
  txLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  txDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  txAmountPos: {color: '#4CAF50'},
  txAmountNeg: {color: colors.error},
  txCenter: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  txEmpty: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // ─── Games tab ────────────────────────────────────────────────────────────
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  searchIcon: {
    color: colors.textMuted,
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchClear: {
    color: colors.textMuted,
    fontSize: 15,
    paddingHorizontal: 2,
  },

  gamesList: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    paddingTop: 4,
  },
  gamesCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamesEmpty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 48,
    lineHeight: 22,
  },
  gamesError: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
});
