import React, {useEffect, useRef, useState} from 'react';
import {Animated, Modal, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../theme/colors';
import {styles} from '../styles/messageBoxStyles';

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageType = 'info' | 'error' | 'confirm';

export interface MessageAction {
  label: string;
  onPress?: () => void;
  /** Red accent — use for destructive actions */
  danger?: boolean;
  /** Bold white label — use for the primary/confirm action */
  primary?: boolean;
}

export interface MessageOptions {
  title: string;
  message: string;
  type?: MessageType;
  actions?: MessageAction[];
}

// ── Global singleton ──────────────────────────────────────────────────────────

let _show: ((options: MessageOptions) => void) | null = null;

/**
 * Show a modal message from anywhere in the app.
 * Requires `<MessageBox />` to be mounted at the root (App.tsx).
 */
export function showMessage(options: MessageOptions) {
  _show?.(options);
}

// ── Type accent bar color ─────────────────────────────────────────────────────

const TYPE_COLORS: Record<MessageType, string> = {
  info: colors.border,
  error: colors.error,
  confirm: colors.textSecondary,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessageBox() {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<MessageOptions | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    _show = (opts: MessageOptions) => {
      setOptions(opts);
      setVisible(true);
    };
    return () => {
      _show = null;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 280,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const hide = () => setVisible(false);

  const handleAction = (action: MessageAction) => {
    hide();
    action.onPress?.();
  };

  if (!options) {return null;}

  const type = options.type ?? 'info';
  const actions: MessageAction[] = options.actions ?? [{label: 'OK', primary: true}];
  const barColor = TYPE_COLORS[type];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={hide}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {transform: [{scale: scaleAnim}], opacity: opacityAnim},
          ]}>

          {/* Type accent bar */}
         {/*  <View style={[styles.typeBar, {backgroundColor: barColor}]} /> */}

          {/* Content */}
          <View style={styles.body}>
            <Text style={styles.title}>{options.title}</Text>
            <Text style={styles.message}>{options.message}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {actions.map((action, index) => {
              const labelStyle = action.danger
                ? styles.labelDanger
                : action.primary
                ? styles.labelPrimary
                : styles.labelDefault;

              return (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.actionBtn, index > 0 && styles.actionBtnBorder]}
                  onPress={() => handleAction(action)}
                  activeOpacity={0.5}>
                  <Text style={labelStyle}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
