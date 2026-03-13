import React from 'react';
import {ActivityIndicator, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ScreenHeader} from '../../components/ScreenHeader';
import {Input} from '../../components/Input';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useEditLightningAddress} from '../../hooks/useEditLightningAddress';
import {styles} from '../../styles/editLightningStyles';
import type {LoginResponse} from '../../types/auth';

interface Props {
  user: LoginResponse;
  initialAddress: string | null;
  onSaved: (address: string | null) => void;
  onBack: () => void;
}

export function EditLightningAddressScreen({user, initialAddress, onSaved, onBack}: Props) {
  const {t} = useTranslation();
  const {address, setAddress, loading, error, handleSave} = useEditLightningAddress(user, initialAddress, onSaved);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('lightning.title')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>{t('lightning.title')}</Text>
        <Text style={styles.hint}>{t('lightning.hint')}</Text>
        <Input
          label={t('lightning.label')}
          placeholder={t('lightning.placeholder')}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          testID="lightning-address-input"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={loading}
          testID="save-lightning-btn">
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>{t('lightning.saveButton')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
