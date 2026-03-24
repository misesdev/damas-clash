import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {ScreenHeader} from '../components/ScreenHeader';
import {useNostrRegister} from '../hooks/useNostrRegister';
import {styles} from '../styles/nostrRegisterStyles';
import type {LoginResponse} from '../types/auth';

interface Props {
  onLogin: (data: LoginResponse) => void;
  onBack: () => void;
}

export function NostrRegisterScreen({onLogin, onBack}: Props) {
  const {t} = useTranslation();
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const {
    step,
    nsec,
    keyCopied,
    username,
    setUsername,
    localAvatar,
    uploadingAvatar,
    error,
    generateKey,
    handleCopyKey,
    handleContinueToProfile,
    handleAvatarPick,
    handleCreateAccount,
    canCreate,
  } = useNostrRegister(onLogin);

  useEffect(() => {
    generateKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCopyNsec = () => {
    Clipboard.setString(nsec);
    handleCopyKey();
  };

  // Generating step
  if (step === 'generating') {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={t('nostrRegister.title')} onBack={onBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{t('nostrRegister.generating')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Registering step
  if (step === 'registering') {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={t('nostrRegister.title')} onBack={() => {}} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {uploadingAvatar
              ? t('nostrRegister.uploadingPhoto')
              : t('nostrRegister.registering')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('nostrRegister.title')} onBack={onBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {step === 'showKey' && (
            <>
              {/* Icon + title */}
              <View style={styles.intro}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🔐</Text>
                </View>
                <Text style={styles.introTitle}>{t('nostrRegister.keyTitle')}</Text>
                <Text style={styles.introSubtitle}>{t('nostrRegister.keySubtitle')}</Text>
              </View>

              {/* Warning box */}
              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>{t('nostrRegister.keyWarning')}</Text>
              </View>

              {/* nsec display */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('nostrRegister.yourKey')}</Text>
                <View style={styles.keyBox}>
                  <Text style={styles.keyText} testID="nsec-display">{nsec}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyButton, keyCopied && styles.copyButtonDone]}
                  onPress={onCopyNsec}
                  testID="copy-key-button">
                  <Text style={styles.copyButtonText}>
                    {keyCopied ? `✓ ${t('nostrRegister.copied')}` : t('nostrRegister.copy')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Saved checkbox */}
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setSavedConfirmed(v => !v)}
                testID="saved-checkbox">
                <View style={[styles.checkbox, savedConfirmed && styles.checkboxChecked]}>
                  {savedConfirmed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>{t('nostrRegister.savedConfirm')}</Text>
              </TouchableOpacity>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                label={t('nostrRegister.continue')}
                onPress={handleContinueToProfile}
                disabled={!keyCopied || !savedConfirmed}
                style={styles.continueButton}
                testID="continue-button"
              />
            </>
          )}

          {step === 'profile' && (
            <>
              {/* Title */}
              <View style={styles.profileHeader}>
                <Text style={styles.profileTitle}>{t('nostrRegister.profileTitle')}</Text>
                <Text style={styles.profileSubtitle}>{t('nostrRegister.profileSubtitle')}</Text>
              </View>

              {/* Avatar picker */}
              <View style={styles.avatarWrapper}>
                <TouchableOpacity
                  style={styles.avatarTouchable}
                  onPress={handleAvatarPick}
                  activeOpacity={0.85}
                  testID="avatar-picker">
                  <View style={styles.avatarCircle}>
                    {localAvatar ? (
                      <Image
                        source={{uri: localAvatar.uri}}
                        style={styles.avatarImage}
                        testID="avatar-preview"
                      />
                    ) : (
                      <Text style={styles.avatarPlaceholderIcon}>👤</Text>
                    )}
                  </View>
                  <View style={styles.cameraBadge}>
                    <Text style={styles.cameraBadgeIcon}>📷</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Username form card */}
              {/* <View style={styles.formCard}> */}
                <Input
                  label={t('nostrRegister.usernameLabel')}
                  placeholder={t('nostrRegister.usernamePlaceholder')}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="username-input"
                />
              {/* </View> */}

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                label={t('nostrRegister.createButton')}
                onPress={handleCreateAccount}
                disabled={!canCreate}
                style={styles.continueButton}
                testID="create-account-button"
              />
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
