import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {confirmEmail} from '../api/auth';
import {ApiError} from '../api/client';
import type {LoginResponse} from '../types/auth';

const RESEND_COOLDOWN = 60;

interface Options {
  email: string;
  onConfirmed: (data?: LoginResponse) => void;
  onSubmitCode?: (code: string) => Promise<void>;
  onResendCode?: () => Promise<void>;
}

export function useConfirmEmail({email, onConfirmed, onSubmitCode, onResendCode}: Options) {
  const {t} = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(
    () => () => {
      if (cooldownRef.current) {clearInterval(cooldownRef.current);}
    },
    [],
  );

  const handleResend = async () => {
    if (!onResendCode || resendCooldown > 0) {return;}
    try {
      await onResendCode();
      setResendSuccess(true);
      setError('');
      startCooldown();
    } catch {
      setError(t('confirmEmail.errors.resendError'));
    }
  };

  const handleConfirm = async () => {
    setError('');
    if (code.length !== 6) {
      setError(t('confirmEmail.errors.invalidLength'));
      return;
    }
    setLoading(true);
    try {
      if (onSubmitCode) {
        await onSubmitCode(code);
      } else {
        const data = await confirmEmail({email, code});
        onConfirmed(data);
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError(t('confirmEmail.errors.invalidCode'));
      } else {
        setError(t('confirmEmail.errors.connectionError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    code,
    setCode,
    error,
    loading,
    resendCooldown,
    resendSuccess,
    handleResend,
    handleConfirm,
  };
}
