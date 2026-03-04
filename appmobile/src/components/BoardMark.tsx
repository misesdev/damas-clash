import React from 'react';
import {View} from 'react-native';

interface BoardMarkProps {
  size?: number;
}

// 2×2 checkerboard motif used as the app logo mark
export function BoardMark({size = 40}: BoardMarkProps) {
  const cell = size / 2;
  const cells = [
    {light: false},
    {light: true},
    {light: true},
    {light: false},
  ];

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
      {cells.map(({light}, i) => (
        <View
          key={i}
          style={{
            width: cell,
            height: cell,
            backgroundColor: light ? '#FFFFFF' : '#2C2C2C',
          }}
        />
      ))}
    </View>
  );
}
