import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingVertical: 48,
  },

  header: {marginBottom: 40},
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 10},
  emailChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emailChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  form: {marginBottom: 40},
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  errorText: {color: colors.error, fontSize: 13, lineHeight: 20},
  submitButton: {marginTop: 28},

  resendArea: {alignItems: 'center', marginTop: 20, gap: 6},
  resendButton: {paddingVertical: 8, paddingHorizontal: 16},
  resendSuccess: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  resendText: {color: colors.textSecondary, fontSize: 13, fontWeight: '500'},
  resendDisabled: {color: colors.textMuted},

  footer: {alignItems: 'center', gap: 16},
  divider: {width: 40, height: 1, backgroundColor: colors.border},
  footerText: {color: colors.textMuted, fontSize: 14},
  footerLink: {color: colors.textSecondary, fontWeight: '600'},
});
