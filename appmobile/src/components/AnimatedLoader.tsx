import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";


export default function AnimatedLoader() 
{
    const pulse = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulse, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulse, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0.4,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ).start();
    }, [pulse, opacity]);
    return (
        <View style={styles.ringWrapper}>
            <Animated.View
                style={[
                    styles.ringOuter,
                    {transform: [{scale: pulse}], opacity},
                ]}
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

    )
}

const styles = StyleSheet.create({
    ringWrapper: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringOuter: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: colors.text,
    },
    ringInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.surfaceRaised,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boardIcon: {gap: 4},
    boardRow: {flexDirection: 'row', gap: 4},
    boardCell: {
        width: 14,
        height: 14,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: colors.border,
    },
})
