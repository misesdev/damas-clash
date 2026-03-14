import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ScreenHeader} from '../../components/ScreenHeader';
import {QRScannerInput} from '../../components/QRScannerInput';
import {useEditLightningAddress} from '../../hooks/useEditLightningAddress';
import {styles} from '../../styles/editLightningStyles';
import type {LoginResponse} from '../../types/auth';

interface Props {
  user: LoginResponse;
  initialAddress: string | null;
  onSaved: (address: string | null) => void;
  onBack: () => void;
}

export function EditLightningAddressScreen({
  user,
  initialAddress,
  onSaved,
  onBack,
}: Props) {
  const {t} = useTranslation();
  const {address, setAddress, loading, error, handleSave} =
    useEditLightningAddress(user, initialAddress, onSaved);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('lightning.title')} onBack={onBack} />

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{t('lightning.title')}</Text>
          <Text style={styles.hint}>{t('lightning.hint')}</Text>

          <QRScannerInput
            label={t('lightning.label')}
            placeholder={t('lightning.placeholder')}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            scannerTitle={t('qrScanner.title')}
            testID="lightning-address-input"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        {/* Footer — stays above keyboard */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            testID="save-lightning-btn">
            {loading ? (
              <ActivityIndicator color={styles.saveBtnText.color} />
            ) : (
              <Text style={styles.saveBtnText}>{t('lightning.saveButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
