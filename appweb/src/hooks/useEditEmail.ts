'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { confirmEmailChange, requestEmailChange } from '../api/players';
import type { LoginResponse } from '../types/auth';
import '../i18n';

export function useEditEmail(
  user: LoginResponse,
  onSaved: (newEmail: string) => void,
  onBack: () => void,
) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'input' | 'confirm'>('input');
  const [newEmail, setNewEmailRaw] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim()) &&
    newEmail.trim().length <= 100 &&
    newEmail.trim() !== user.email;

  const setNewEmail = (val: string) => {
    setNewEmailRaw(val);
    setError('');
  };

  const handleRequestChange = async () => {
    setLoading(true);
    setError('');
    try {
      await requestEmailChange(user.token, newEmail.trim());
      setPhase('confirm');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('editEmail_errorRequest'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmChange = async () => {
    setLoading(true);
    setError('');
    try {
      await confirmEmailChange(user.token, newEmail.trim(), code);
      onSaved(newEmail.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('editEmail_errorCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (phase === 'confirm') {
      setPhase('input');
      setCode('');
      setError('');
    } else {
      onBack();
    }
  };

  return {
    phase,
    newEmail,
    setNewEmail,
    code,
    setCode,
    loading,
    error,
    emailValid,
    handleRequestChange,
    handleConfirmChange,
    handleBack,
  };
}
