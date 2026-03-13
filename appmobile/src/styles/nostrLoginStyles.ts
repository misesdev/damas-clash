import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  body: {flex: 1},

  form: {flex: 1, padding: 20, gap: 16},

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  brandIcon: {fontSize: 32},
  brandLabel: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
  },

  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },

  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {color: colors.error, fontSize: 14, lineHeight: 20},

  footer: {padding: 20},
});
