import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {withdrawToAddress} from '../api/wallet';
import {ApiError} from '../api/client';
import type {LoginResponse} from '../types/auth';
import type {WalletResponse} from '../types/wallet';

// Accepts Lightning Address (user@domain.com) or LNURL (lnurl...).
function isValidDestination(addr: string): boolean {
  const a = addr.trim().toLowerCase();
  if (a.startsWith('lnurl')) {return true;}
  const parts = a.split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].includes('.');
}

export function useWithdraw(
  user: LoginResponse,
  wallet: WalletResponse | null,
  initialAddress: string | null,
  onSuccess: () => void,
) {
  const {t} = useTranslation();
  const [amountText, setAmountText] = useState('');
  const [targetAddress, setTargetAddress] = useState(initialAddress ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);

  const amount = parseInt(amountText, 10) || 0;
  const available = wallet?.availableBalanceSats ?? 0;
  const canWithdraw =
    !loading &&
    amount > 0 &&
    amount <= available &&
    targetAddress.trim().length > 0 &&
    addressError === '';

  const handleSetTargetAddress = (val: string) => {
    setTargetAddress(val);
    if (addressError) {setAddressError('');}
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) {return;}

    const addr = targetAddress.trim();
    if (!isValidDestination(addr)) {
      setAddressError(t('withdraw.errors.invalidAddress'));
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await withdrawToAddress(user.token, amount, addr);
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
    amountText,
    setAmountText,
    targetAddress,
    setTargetAddress: handleSetTargetAddress,
    addressError,
    loading,
    error,
    success,
    paidAmount,
    amount,
    available,
    canWithdraw,
    handleWithdraw,
  };
}
