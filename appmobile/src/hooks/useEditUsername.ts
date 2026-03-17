import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {updateUsername} from '../api/players';
import type {LoginResponse} from '../types/auth';

export function useEditUsername(user: LoginResponse, onSaved: (newUsername: string) => void) {
  const {t} = useTranslation();
  const [username, setUsername] = useState(user.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trimmedUsername = username.trim();
  const valid = trimmedUsername.length >= 3 && trimmedUsername.length <= 30 && trimmedUsername !== user.username;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateUsername(user.token, user.playerId, trimmedUsername);
      onSaved(username.trim());
    } catch (e: any) {
      setError(e.message ?? t('editUsername.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return {username, setUsername, loading, error, valid, handleSave};
}
