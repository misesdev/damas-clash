import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {updateUsername} from '../api/players';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {ScreenHeader} from '../components/ScreenHeader';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';

interface Props {
  user: LoginResponse;
  onSaved: (newUsername: string) => void;
  onBack: () => void;
}

export function EditUsernameScreen({user, onSaved, onBack}: Props) {
  const [username, setUsername] = useState(user.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = username.trim().length >= 3 && username.trim() !== user.username;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateUsername(user.token, user.playerId, username.trim());
      onSaved(username.trim());
    } catch (e: any) {
      setError(e.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  body: {flex: 1},
  form: {padding: 20},
  hint: {color: colors.textMuted, fontSize: 12, marginTop: 8},
  footer: {padding: 20},
});
