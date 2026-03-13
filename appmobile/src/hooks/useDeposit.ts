import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Clipboard} from 'react-native';
import {initiateDeposit, checkDepositStatus} from '../api/wallet';
import type {LoginResponse} from '../types/auth';
import type {DepositInitiatedResponse} from '../types/wallet';

type DepositStep = 'amount' | 'invoice' | 'success';

export function useDeposit(user: LoginResponse, onSuccess: () => void) {
  const {t} = useTranslation();
  const [step, setStep] = useState<DepositStep>('amount');
  const [amountText, setAmountText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deposit, setDeposit] = useState<DepositInitiatedResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [creditedAmount, setCreditedAmount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard: prevents a slow check from stacking up concurrent requests
  const isCheckingRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPolling = useCallback((rHash: string) => {
    stopPolling();
    isCheckingRef.current = false;
    pollRef.current = setInterval(async () => {
      if (isCheckingRef.current) {return;}
      isCheckingRef.current = true;
      try {
        const status = await checkDepositStatus(user.token, rHash);
        if (status.credited) {
          stopPolling();
          setCreditedAmount(status.amountSats);
          setStep('success');
          setTimeout(() => onSuccess(), 2500);
        }
      } catch {
        // ignore poll errors
      } finally {
        isCheckingRef.current = false;
      }
    }, 3000);
  }, [user.token, stopPolling, onSuccess]);

  const handleSubmitAmount = async () => {
    const amount = parseInt(amountText, 10);
    if (!amount || amount <= 0) {
      setError(t('deposit.errors.invalidAmount'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await initiateDeposit(user.token, amount, 'DamasClash deposit');
      setDeposit(result);
      setStep('invoice');
      startPolling(result.rHash);
    } catch {
      setError(t('deposit.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!deposit) {return;}
    Clipboard.setString(deposit.invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return {
    step,
    amountText,
    setAmountText,
    loading,
    error,
    deposit,
    copied,
    creditedAmount,
    handleSubmitAmount,
    handleCopy,
  };
}
