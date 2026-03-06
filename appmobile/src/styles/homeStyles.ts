import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {color: colors.textSecondary, fontSize: 13},
  username: {color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3},

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
