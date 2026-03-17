import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const chatStyles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},

  // ─── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerDotOn: {backgroundColor: '#4CAF50'},
  headerDotOff: {backgroundColor: colors.textMuted},
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  onlineDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50'},
  onlineCount: {fontSize: 12, fontWeight: '700', color: colors.textSecondary},

  // ─── Error banner ────────────────────────────────────────────────────────────
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {color: colors.error, fontSize: 13, textAlign: 'center'},

  // ─── Empty state ─────────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 40,
  },
  emptyIcon: {fontSize: 36},
  emptyText: {color: colors.textMuted, fontSize: 14},

  // ─── Message list ────────────────────────────────────────────────────────────
  list: {paddingHorizontal: 12, paddingVertical: 16, gap: 12},

  // ─── Message row ─────────────────────────────────────────────────────────────
  msgRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  msgRowMe: {justifyContent: 'flex-end'},

  // ─── Bubbles ─────────────────────────────────────────────────────────────────
  msgBubble: {
    maxWidth: '78%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 13,
    paddingTop: 7,
    paddingBottom: 6,
  },
  msgBubbleMe: {
    backgroundColor: '#1F1F1F',
    borderRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  msgUsername: {
    color: '#5B9EF5',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  msgTime: {
    color: colors.textMuted,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  // ─── Message meta row (time + edited) ────────────────────────────────────────
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },

  // ─── Edited / Deleted indicators ─────────────────────────────────────────────
  msgEdited: {
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  msgDeleted: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // ─── Edit mode banner (above input bar) ──────────────────────────────────────
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 10,
  },
  editBannerBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: '#5B9CF6',
  },
  editBannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(91,156,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBannerIcon: {fontSize: 15},
  editBannerContent: {flex: 1, minWidth: 0},
  editBannerLabel: {
    color: '#5B9CF6',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  editBannerPreview: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  editBannerCancel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBannerCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 18,
  },

  // ─── Action sheet ─────────────────────────────────────────────────────────────
  actionSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  // preview strip (message text at top of sheet)
  actionSheetPreviewWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: 6,
  },
  actionSheetPreview: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // action rows
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionSheetIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetIconDanger: {
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  actionSheetIcon: {fontSize: 18},
  actionSheetItemText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  actionSheetDanger: {
    color: colors.error,
  },
  actionSheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },

  // cancel button (bottom, pill-shaped)
  actionSheetCancelButton: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
  },
  actionSheetCancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // delete confirmation
  actionSheetConfirmHeader: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: 6,
  },
  actionSheetConfirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,69,58,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionSheetConfirmIconText: {fontSize: 26},
  actionSheetConfirmTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  actionSheetConfirmBody: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSheetDeleteButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  actionSheetDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
