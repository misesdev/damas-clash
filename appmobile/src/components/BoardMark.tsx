import React from 'react';
import { View, Image } from 'react-native';

interface BoardMarkProps {
  size?: number;
}

// 2×2 checkerboard motif used as the app logo mark
export function BoardMark({size = 40}: BoardMarkProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        <Image 
            source={require('../../assets/default-icon.png')} 
            style={{ flex: 1, width: size, height: size }} 
        />
    </View>
  );
}
