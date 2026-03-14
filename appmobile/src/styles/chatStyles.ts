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
});
