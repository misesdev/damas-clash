import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  keyboardView: {flex: 1},

  // ─── Scrollable content ───────────────────────────────────────────────────
  scroll: {
    padding: 24,
    paddingBottom: 8,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
    //textTransform: 'uppercase',
    marginBottom: 8,
  },
  amountSection: {
    marginTop: 20,
  },
  availableHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  // ─── Footer ───────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  withdrawBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  withdrawBtnDisabled: {
    opacity: 0.35,
  },
  withdrawBtnText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // ─── Success state ────────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIcon: {fontSize: 64, marginBottom: 20},
  successTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ─── Register-address button (kept for compat) ────────────────────────────
  registerBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  registerBtnText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
  },
});
