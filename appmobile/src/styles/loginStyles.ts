import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center'},

  logoArea: {alignItems: 'center', marginBottom: 56},
  appName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 8,
    marginTop: 18,
  },

  form: {marginBottom: 36},
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {color: colors.error, fontSize: 14, lineHeight: 20},
  submitButton: {marginTop: 16},

  footer: {alignItems: 'center', gap: 18},
  divider: {width: 32, height: 1, backgroundColor: colors.border},
  footerText: {color: colors.textMuted, fontSize: 14},
  footerLink: {color: colors.textSecondary, fontWeight: '600'},
});
