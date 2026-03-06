import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {styles} from '../styles/screenHeaderStyles';

interface Props {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({title, onBack}: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        hitSlop={styles.hitSlop}
        testID="screen-header-back">
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
