import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  body: {flex: 1},
  form: {padding: 20},
  hint: {color: colors.textMuted, fontSize: 12, marginTop: 8},
  footer: {padding: 20},
});
