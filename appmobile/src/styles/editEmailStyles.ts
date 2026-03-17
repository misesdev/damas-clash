import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  body: {flex: 1},
  current: {color: colors.textSecondary, fontSize: 13, marginBottom: 16},
  hint: {color: colors.textMuted, fontSize: 12, marginTop: 8},
  instruction: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  emailHighlight: {color: colors.text, fontWeight: '600'},
  errorText: {color: colors.error, fontSize: 13, marginTop: 14},
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  scroll: {
    padding: 24,
    paddingBottom: 16,
  },
});
