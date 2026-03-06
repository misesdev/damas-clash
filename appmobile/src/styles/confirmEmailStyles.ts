import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', paddingVertical: 60},

  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  icon: {fontSize: 26},

  header: {marginBottom: 40},
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
    lineHeight: 38,
  },
  subtitle: {color: colors.textMuted, fontSize: 15, lineHeight: 24},
  emailText: {color: colors.textSecondary, fontWeight: '600'},

  form: {marginBottom: 44},
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  errorText: {color: colors.error, fontSize: 14, lineHeight: 20},
  submitButton: {marginTop: 24},

  resendArea: {alignItems: 'center', marginTop: 20, gap: 6},
  resendSuccess: {color: colors.textSecondary, fontSize: 13},
  resendText: {color: colors.textSecondary, fontSize: 13, fontWeight: '500'},
  resendDisabled: {color: colors.textMuted},

  footer: {alignItems: 'center', gap: 18},
  divider: {width: 32, height: 1, backgroundColor: colors.border},
  footerText: {color: colors.textMuted, fontSize: 14},
  footerLink: {color: colors.textSecondary, fontWeight: '600'},
});
