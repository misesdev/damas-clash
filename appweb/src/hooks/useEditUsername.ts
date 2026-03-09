'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateUsername } from '../api/players';
import type { LoginResponse } from '../types/auth';
import '../i18n';

export function useEditUsername(user: LoginResponse, onSaved: (newUsername: string) => void) {
  const { t } = useTranslation();
  const [username, setUsername] = useState(user.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = username.trim().length >= 3 && username.trim().length <= 50 && username.trim() !== user.username;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateUsername(user.token, user.playerId, username.trim());
      onSaved(username.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('editUsername_errorSave'));
    } finally {
      setLoading(false);
    }
  };

  return { username, setUsername, loading, error, valid, handleSave };
}
