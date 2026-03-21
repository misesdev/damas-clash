import React from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {colors} from '../theme/colors';
import {ZAPSTORE_URL, ZAPSTORE_WEB_URL, GITHUB_APK_URL} from '../api/appVersion';

interface Props {
  onDismiss: () => void;
}

export function UpdateAppScreen({onDismiss}: Props) {
  const {t} = useTranslation();

  const openZapstore = async () => {
    const canOpen = await Linking.canOpenURL(ZAPSTORE_URL);
    await Linking.openURL(canOpen ? ZAPSTORE_URL : ZAPSTORE_WEB_URL);
  };

  const openGithub = () => Linking.openURL(GITHUB_APK_URL);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>{t('app.name')}</Text>
        <Text style={styles.title}>{t('updateApp.title')}</Text>
        <Text style={styles.message}>{t('updateApp.message')}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={openZapstore}>
          <Text style={styles.primaryButtonText}>{t('updateApp.zapstoreButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={openGithub}>
          <Text style={styles.secondaryButtonText}>{t('updateApp.githubButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>{t('updateApp.dismiss')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
