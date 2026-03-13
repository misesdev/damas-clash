import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {withdrawToAddress} from '../api/wallet';
import {ApiError} from '../api/client';
import type {LoginResponse} from '../types/auth';
import type {WalletResponse} from '../types/wallet';

export function useWithdraw(
  user: LoginResponse,
  wallet: WalletResponse | null,
  onSuccess: () => void,
) {
  const {t} = useTranslation();
  const [amountText, setAmountText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);

  const amount = parseInt(amountText, 10) || 0;
  const available = wallet?.availableBalanceSats ?? 0;
  const canWithdraw = !loading && amount > 0 && amount <= available;

  const handleWithdraw = async () => {
    if (!canWithdraw) {return;}
    setError('');
    setLoading(true);
    try {
      const result = await withdrawToAddress(user.token, amount);
      setPaidAmount(result.amountSats);
      setSuccess(true);
      setTimeout(() => onSuccess(), 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError(t('withdraw.errors.insufficientBalance'));
        } else if (err.status === 422) {
          setError(t('withdraw.errors.addressError'));
        } else {
          setError(t('withdraw.errors.failed'));
        }
      } else {
        setError(t('withdraw.errors.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    amountText, setAmountText,
    loading, error, success, paidAmount,
    amount, available, canWithdraw,
    handleWithdraw,
  };
}
