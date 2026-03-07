import {useCallback, useEffect, useRef, useState} from 'react';
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
      setError('Erro ao reenviar o código. Tente novamente.');
    }
  };

  const handleConfirm = async () => {
    setError('');
    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos.');
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
        setError('Código inválido ou expirado. Tente novamente.');
      } else {
        setError('Erro de conexão. Tente novamente.');
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
