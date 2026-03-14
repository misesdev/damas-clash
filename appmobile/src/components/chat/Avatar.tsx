import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../theme/colors';

interface Props {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({username, avatarUrl, size = 32}: Props) {
  const radius = size / 2;
  if (avatarUrl) {
    return (
      <Image
        source={{uri: avatarUrl}}
        style={{width: size, height: size, borderRadius: radius, flexShrink: 0}}
      />
    );
  }
  return (
    <View
      style={[styles.avatar, {width: size, height: size, borderRadius: radius}]}>
      <Text style={[styles.avatarText, {fontSize: size * 0.44}]}>
        {username[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
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
