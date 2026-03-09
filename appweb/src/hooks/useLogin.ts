'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { login } from '../api/auth';
import { ApiError } from '../api/client';
import '../i18n';

export function useLogin(onCodeSent: (email: string) => void) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { email } = await login({ identifier });
      onCodeSent(email);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.status === 403
            ? t('login_errorUnconfirmed')
            : t('login_errorNotFound'),
        );
      } else {
        setError(t('login_errorConnection'));
      }
    } finally {
      setLoading(false);
    }
  };

  return { identifier, setIdentifier, error, loading, handleLogin };
}
