import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 8,
  },

  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Intro (key step only) ───────────────────────────────────────────────
  intro: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
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

  // ── Warning box ────────────────────────────────────────────────────────
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 180, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 0, 0.25)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 10,
  },
  warningIcon: {fontSize: 16, lineHeight: 22},
  warningText: {
    flex: 1,
    color: '#FFB400',
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Sections ───────────────────────────────────────────────────────────
  section: {
    gap: 10,
    marginBottom: 16,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Key display ────────────────────────────────────────────────────────
  keyBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  keyText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
    letterSpacing: 0.5,
  },

  copyButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  copyButtonDone: {
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
  },
  copyButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Checkbox row ───────────────────────────────────────────────────────
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  checkmark: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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

  // ── Profile step ───────────────────────────────────────────────────────
  profileHeader: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 32,
  },
  profileTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  profileSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // ── Avatar picker ──────────────────────────────────────────────────────
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: 32,
    marginTop: 4,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholderIcon: {
    fontSize: 46,
    lineHeight: 56,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadgeIcon: {
    fontSize: 14,
    lineHeight: 16,
  },

  // ── Profile form card ──────────────────────────────────────────────────
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    marginBottom: 20,
  },

  // ── Bottom button ─────────────────────────────────────────────────────
  continueButton: {marginTop: 4},
});
