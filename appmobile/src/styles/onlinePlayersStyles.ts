import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  // Modal backdrop + container
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    //justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    //maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {gap: 2},
  title: {color: colors.text, fontSize: 18, fontWeight: '700'},
  subtitle: {color: colors.textMuted, fontSize: 12, fontWeight: '500'},
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {color: colors.textSecondary, fontSize: 14, fontWeight: '600'},

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  searchIcon: {color: colors.textMuted, fontSize: 14},
  searchInput: {flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0},
  searchClear: {color: colors.textMuted, fontSize: 16, paddingHorizontal: 2},

  // List
  list: {paddingHorizontal: 20, paddingBottom: 40},
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },

  // Player row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: {width: 40, height: 40, borderRadius: 20},
  avatarInitials: {color: colors.text, fontSize: 14, fontWeight: '700'},
  info: {flex: 1, minWidth: 0},
  username: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  statusDot: {width: 6, height: 6, borderRadius: 3},
  statusDotOnline: {backgroundColor: '#4CAF50'},
  statusDotInGame: {backgroundColor: '#FF9800'},
  statusText: {fontSize: 11, fontWeight: '500'},
  statusOnline: {color: '#4CAF50'},
  statusInGame: {color: '#FF9800'},

  // Action buttons
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  challengeBtn: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  challengeBtnText: {color: colors.bg, fontSize: 12, fontWeight: '700'},
  watchBtn: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  watchBtnText: {color: colors.textSecondary, fontSize: 12, fontWeight: '600'},
  waitingBtn: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  waitingBtnText: {color: colors.textMuted, fontSize: 12, fontWeight: '500'},
});
