import React from 'react';
import {View} from 'react-native';

export const Camera = ({testID, ...props}: any) =>
  React.createElement(View, {testID: testID ?? 'mock-camera', ...props});

export function useCameraDevice() {
  return {id: 'mock-device'};
}

export function useCameraPermission() {
  return {
    hasPermission: true,
    requestPermission: jest.fn().mockResolvedValue(true),
  };
}

export function useCodeScanner({onCodeScanned}: {onCodeScanned: (codes: any[]) => void}) {
  return {onCodeScanned};
}
