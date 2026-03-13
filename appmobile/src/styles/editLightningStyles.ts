import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: 24},
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 28,
    lineHeight: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
  },
});
