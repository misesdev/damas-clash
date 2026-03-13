import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  amount: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
  },
  lockedLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 14,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  btnTextPrimary: {
    color: colors.primaryText,
  },
  historyBtn: {
    marginTop: 10,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  historyBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
