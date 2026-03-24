import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../../theme/colors';

interface Props {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  onPress?: () => void;
  testID?: string;
}

export function Avatar({username, avatarUrl, size = 32, onPress, testID}: Props) {
  const radius = size / 2;

  const inner = avatarUrl ? (
    <Image
      source={{uri: avatarUrl}}
      style={{width: size, height: size, borderRadius: radius, flexShrink: 0}}
    />
  ) : (
    <View
      // onStartShouldSetResponder lets TouchableOpacity detect the tap even on
      // a plain View child (no native touch handler by default on Android).
      onStartShouldSetResponder={() => true}
      style={[styles.avatar, {width: size, height: size, borderRadius: radius}]}>
      <Text style={[styles.avatarText, {fontSize: size * 0.44}]}>
        {username[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
        hitSlop={6}>
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexShrink: 0,
  },
  avatarText: {color: colors.text, fontWeight: '700'},
});
