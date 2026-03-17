import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  body: {flex: 1},
  form: {padding: 20},
  hint: {color: colors.textMuted, fontSize: 12, marginTop: 8},
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
