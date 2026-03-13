'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NostrAuthService, NostrKey } from '../services/nostr/NostrAuthService';
import type { LoginResponse } from '../types/auth';

type Status = 'idle' | 'loading';

export function useNostrLogin(onLogin: (data: LoginResponse) => void) {
  const { t } = useTranslation();
  const [nsec, setNsec] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const handleLogin = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await NostrAuthService.authenticate(nsec.trim());
      onLogin(data);
    } catch {
      setError(t('nostrLogin_errorAuthFailed'));
      setStatus('idle');
    }
  }, [nsec, onLogin, t]);

  return {
    nsec,
    setNsec,
    status,
    error,
    handleLogin,
    canSubmit: status === 'idle' && NostrKey.validateNsec(nsec.trim()),
  };
}
