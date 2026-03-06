import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {styles} from '../styles/screenHeaderStyles';
import { Icon } from './Icon';

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
        <Icon name='chevron-back' size={20}/>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}
