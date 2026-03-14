import React, {useCallback} from 'react';
import {
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import {useTranslation} from 'react-i18next';
import {Icon} from './Icon';
import {colors} from '../theme/colors';

interface Props {
  visible: boolean;
  onScan: (value: string) => void;
  onClose: () => void;
  title?: string;
}

export function QRScannerModal({visible, onScan, onClose, title}: Props) {
  const {t} = useTranslation();
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: useCallback(
      (codes: {value?: string}[]) => {
        const value = codes[0]?.value;
        if (value) {
          onScan(value);
          onClose();
        }
      },
      [onScan, onClose],
    ),
  });

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title ?? t('qrScanner.title')}</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            testID="qr-scanner-close">
            <Icon name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Camera area */}
        <View style={styles.cameraContainer}>
          {!hasPermission ? (
            <View style={styles.permissionBox}>
              <Icon name="camera-off-outline" size={48} color={colors.textMuted} />
              <Text style={styles.permissionText}>
                {t('qrScanner.permissionDenied')}
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={handleRequestPermission}>
                <Text style={styles.permissionBtnText}>
                  {t('qrScanner.grantPermission')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : device == null ? (
            <View style={styles.permissionBox}>
              <Icon name="camera-off-outline" size={48} color={colors.textMuted} />
              <Text style={styles.permissionText}>
                {t('qrScanner.permissionDenied')}
              </Text>
            </View>
          ) : (
            <>
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={visible}
                codeScanner={codeScanner}
                testID="qr-camera"
              />

              {/* Viewfinder overlay */}
              <View style={styles.overlay} pointerEvents="none">
                <View style={styles.overlayTop} />
                <View style={styles.overlayMiddle}>
                  <View style={styles.overlaySide} />
                  <View style={styles.viewfinder}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                  <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom}>
                  <Text style={styles.hint}>{t('qrScanner.pointCamera')}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const VIEWFINDER_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CORNER_RADIUS = 4;
const OVERLAY_COLOR = 'rgba(0,0,0,0.62)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1E1E1E',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },

  // ─── Camera ────────────────────────────────────────────────────────────────
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  // ─── Viewfinder overlay ────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayTop: {flex: 1, backgroundColor: OVERLAY_COLOR},
  overlayMiddle: {flexDirection: 'row', height: VIEWFINDER_SIZE},
  overlaySide: {flex: 1, backgroundColor: OVERLAY_COLOR},
  overlayBottom: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    alignItems: 'center',
    paddingTop: 24,
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: 'relative',
  },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // ─── Corner brackets ──────────────────────────────────────────────────────
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.text,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.text,
    borderTopRightRadius: CORNER_RADIUS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.text,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.text,
    borderBottomRightRadius: CORNER_RADIUS,
  },

  // ─── Permission screen ─────────────────────────────────────────────────────
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: colors.text,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
});
