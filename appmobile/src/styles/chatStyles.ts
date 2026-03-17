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

  // ─── Contextual action header (active when a message is selected) ─────────
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A3A5C',
    backgroundColor: '#111827',
    gap: 2,
  },
  actionHeaderClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  actionHeaderCloseText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 20,
  },
  actionHeaderLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionHeaderBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
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
    maxWidth: '90%',
    minWidth: "35%",
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
  msgSelectedOverlay: {
    backgroundColor: 'rgba(91,156,246,0.13)',
    borderRadius: 12,
    marginHorizontal: -6,
    padding: 6,
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

  // ─── Reply banner (above input bar, when replying) ───────────────────────────
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 10,
  },
  replyBannerBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: '#25D366',
  },
  replyBannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37,211,102,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyBannerContent: {flex: 1, minWidth: 0},
  replyBannerLabel: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  replyBannerPreview: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  replyBannerCancel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyBannerCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 18,
  },

  // ─── Swipe-to-reply container + arrow ────────────────────────────────────────
  // swipeContainer is position:relative so the icon can be absolutely placed to
  // the left of the bubble without consuming layout space.
  swipeContainer: {
    position: 'relative',
  },
  swipeReplyIconWrap: {
    position: 'absolute',
    left: -36,
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Reply quote inside a message bubble ─────────────────────────────────────
  replyQuote: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  replyQuoteBar: {
    width: 3,
    backgroundColor: '#25D366',
  },
  replyQuoteBody: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  replyQuoteUsername: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  replyQuoteText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  replyQuoteDeleted: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },

});
