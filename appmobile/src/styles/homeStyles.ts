import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
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
  topBarAvatar: {},
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: 11,
    fontWeight: '600',
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  sectionHeading: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  tabText: {color: colors.textSecondary, fontSize: 13, fontWeight: '500'},
  tabTextActive: {color: colors.primaryText, fontWeight: '600'},

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  searchIcon: {
    color: colors.textMuted,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchClear: {
    color: colors.textMuted,
    fontSize: 16,
    paddingHorizontal: 2,
  },

  loadingArea: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  list: {paddingHorizontal: 20, paddingBottom: 20},
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 48,
    lineHeight: 22,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
});
