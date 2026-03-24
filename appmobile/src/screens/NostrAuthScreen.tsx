import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ScreenHeader} from '../components/ScreenHeader';
import {styles} from '../styles/nostrAuthStyles';
import type {LoginResponse} from '../types/auth';

interface Props {
  onLogin: () => void;
  onRegister: () => void;
  onBack: () => void;
}

export function NostrAuthScreen({onLogin, onRegister, onBack}: Props) {
  const {t} = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('nostrAuth.title')} onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* ── Intro ── */}
        <View style={styles.intro}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⚡</Text>
          </View>
          <Text style={styles.introTitle}>{t('nostrAuth.introTitle')}</Text>
          <Text style={styles.introSubtitle}>{t('nostrAuth.introSubtitle')}</Text>
        </View>

        {/* ── Options ── */}
        <View style={styles.optionsSection}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={onLogin}
            activeOpacity={0.75}
            testID="nostr-signin-button">
            <View style={styles.optionIconBox}>
              <Text style={styles.optionIcon}>🔑</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>{t('nostrAuth.loginTitle')}</Text>
              <Text style={styles.optionDesc}>{t('nostrAuth.loginDesc')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={onRegister}
            activeOpacity={0.75}
            testID="nostr-create-button">
            <View style={styles.optionIconBox}>
              <Text style={styles.optionIcon}>✨</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>{t('nostrAuth.registerTitle')}</Text>
              <Text style={styles.optionDesc}>{t('nostrAuth.registerDesc')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info box ── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{t('nostrAuth.infoText')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
