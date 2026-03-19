import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},

  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Intro ──────────────────────────────────────────────────────────────
  intro: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    gap: 10,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeText: {fontSize: 26},
  introTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  introSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // ── Sections ───────────────────────────────────────────────────────────
  section: {
    gap: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── App Signer card ───────────────────────────────────────────────────
  signerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  signerCardDisabled: {
    opacity: 0.4,
  },
  signerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signerIconText: {fontSize: 18},
  signerInfo: {flex: 1, gap: 2},
  signerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  signerDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  signerTrailing: {
    width: 24,
    alignItems: 'center',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 22,
    lineHeight: 24,
  },

  // ── Divider ───────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 24,
  },
  dividerLine: {flex: 1, height: 1, backgroundColor: colors.border},
  dividerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── nsec ──────────────────────────────────────────────────────────────
  nsecHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -2,
  },

  // ── Error ─────────────────────────────────────────────────────────────
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {color: colors.error, fontSize: 14, lineHeight: 20},

  // ── Footer button ─────────────────────────────────────────────────────
  loginButton: {marginTop: 8},
});
