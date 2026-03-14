import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},

  // ─── Scrollable body ──────────────────────────────────────────────────────
  scroll: {
    padding: 24,
    paddingBottom: 16,
  },
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
    lineHeight: 18,
  },

  // ─── Sticky footer (save button above keyboard) ───────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
