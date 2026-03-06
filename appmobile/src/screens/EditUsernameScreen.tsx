import React from 'react';
import {KeyboardAvoidingView, Platform, SafeAreaView, Text, View} from 'react-native';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {ScreenHeader} from '../components/ScreenHeader';
import {useEditUsername} from '../hooks/useEditUsername';
import {styles} from '../styles/editUsernameStyles';
import type {LoginResponse} from '../types/auth';

interface Props {
  user: LoginResponse;
  onSaved: (newUsername: string) => void;
  onBack: () => void;
}

export function EditUsernameScreen({user, onSaved, onBack}: Props) {
  const {username, setUsername, loading, error, valid, handleSave} = useEditUsername(
    user,
    onSaved,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Nome de usuário" onBack={onBack} />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.form}>
          <Input
            label="Nome de usuário"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
          />
          <Text style={styles.hint}>Mínimo de 3 caracteres.</Text>
        </View>
        <View style={styles.footer}>
          <Button label="Salvar" loading={loading} onPress={handleSave} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
