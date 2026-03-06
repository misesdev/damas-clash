import React, {useEffect, useRef} from 'react';
import {Animated, View} from 'react-native';
import {styles} from '../styles/animatedLoaderStyles';
import {colors} from '../theme/colors';

export default function AnimatedLoader() {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {toValue: 1.2, duration: 1000, useNativeDriver: true}),
          Animated.timing(pulse, {toValue: 1, duration: 1000, useNativeDriver: true}),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {toValue: 1, duration: 1000, useNativeDriver: true}),
          Animated.timing(opacity, {toValue: 0.4, duration: 1000, useNativeDriver: true}),
        ]),
      ]),
    ).start();
  }, [pulse, opacity]);

  return (
    <View style={styles.ringWrapper}>
      <Animated.View
        style={[styles.ringOuter, {transform: [{scale: pulse}], opacity}]}
      />
      <View style={styles.ringInner}>
        <View style={styles.boardIcon}>
          <View style={styles.boardRow}>
            <View style={[styles.boardCell, {backgroundColor: colors.text}]} />
            <View style={[styles.boardCell, {backgroundColor: 'transparent'}]} />
          </View>
          <View style={styles.boardRow}>
            <View style={[styles.boardCell, {backgroundColor: 'transparent'}]} />
            <View style={[styles.boardCell, {backgroundColor: colors.text}]} />
          </View>
        </View>
      </View>
    </View>
  );
}
