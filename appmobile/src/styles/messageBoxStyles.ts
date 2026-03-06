import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  card: {
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  body: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 10,
  },

  // Type indicator bar at top of card
  typeBar: {
    height: 3,
    width: '100%',
  },

  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  // Buttons row
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Each button in the row
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },

  // Button label variants
  labelDefault: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  labelPrimary: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  labelDanger: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
