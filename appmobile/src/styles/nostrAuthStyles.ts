import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},

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
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeText: {fontSize: 28},
  introTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  introSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  // ── Option cards ───────────────────────────────────────────────────────
  optionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {fontSize: 20},
  optionInfo: {flex: 1, gap: 3},
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 24,
    lineHeight: 26,
  },

  // ── Info box ───────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
