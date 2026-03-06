import {useState} from 'react';
import {updateUsername} from '../api/players';
import type {LoginResponse} from '../types/auth';

export function useEditUsername(user: LoginResponse, onSaved: (newUsername: string) => void) {
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

  return {username, setUsername, loading, error, valid, handleSave};
}
