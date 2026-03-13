import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {updateLightningAddress} from '../api/players';
import type {LoginResponse} from '../types/auth';

function isValidFormat(addr: string): boolean {
  const parts = addr.trim().split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].includes('.');
}

export function useEditLightningAddress(
  user: LoginResponse,
  initialAddress: string | null,
  onSaved: (address: string | null) => void,
) {
  const {t} = useTranslation();
  const [address, setAddress] = useState(initialAddress ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = address.trim();

    if (trimmed !== '' && !isValidFormat(trimmed)) {
      setError(t('lightning.errors.invalid'));
      return;
    }

    setError('');
    setLoading(true);
    try {
      const profile = await updateLightningAddress(user.token, user.playerId, trimmed || null);
      onSaved(profile.lightningAddress);
    } catch (err: any) {
      const code: string = err?.message ?? '';
      const map: Record<string, string> = {
        invalid_format: t('lightning.errors.invalid'),
        unreachable: t('lightning.errors.unreachable'),
        lnurl_error: t('lightning.errors.lnurl_error'),
        not_pay_request: t('lightning.errors.not_pay_request'),
      };
      setError(map[code] ?? t('lightning.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return {address, setAddress, loading, error, handleSave};
}
