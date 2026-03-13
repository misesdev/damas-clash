import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  option: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    gap: 4,
  },
  optionActive: {
    borderColor: colors.text,
    backgroundColor: '#1C1C1C',
  },
  optionEmoji: {fontSize: 24, marginBottom: 4},
  optionLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  optionDesc: {
    color: colors.textMuted,
    fontSize: 11,
  },
  availableText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createBtnDisabled: {
    backgroundColor: colors.surfaceRaised,
  },
  createBtnText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
  },
  createBtnTextDisabled: {
    color: colors.textMuted,
  },
});
