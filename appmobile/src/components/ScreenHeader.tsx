import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../theme/colors';

interface Props {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({title, onBack}: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={styles.hitSlop}>
        <View style={styles.arrow}>
          <View style={styles.arrowTop} />
          <View style={styles.arrowBottom} />
        </View>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const ARROW_THICKNESS = 2;
const ARROW_SIZE = 10;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitSlop: {top: 8, bottom: 8, left: 8, right: 8} as any,
  arrow: {
    width: ARROW_SIZE,
    height: ARROW_SIZE * 2,
    justifyContent: 'center',
  },
  arrowTop: {
    width: ARROW_SIZE,
    height: ARROW_THICKNESS,
    backgroundColor: colors.text,
    borderRadius: ARROW_THICKNESS,
    transform: [{rotate: '-45deg'}, {translateY: ARROW_SIZE / 2 - 1}],
  },
  arrowBottom: {
    width: ARROW_SIZE,
    height: ARROW_THICKNESS,
    backgroundColor: colors.text,
    borderRadius: ARROW_THICKNESS,
    transform: [{rotate: '45deg'}, {translateY: -(ARROW_SIZE / 2 - 1)}],
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  spacer: {width: 36},
});
