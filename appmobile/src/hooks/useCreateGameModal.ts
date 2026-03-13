import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {WalletResponse} from '../types/wallet';

export type GameMode = 'friendly' | 'bet';

export function useCreateGameModal(
  visible: boolean,
  wallet: WalletResponse | null,
  onConfirm: (betAmountSats: number) => void,
  onClose: () => void,
) {
  const {t} = useTranslation();
  const [mode, setMode] = useState<GameMode>('friendly');
  const [betText, setBetText] = useState('');
  const [error, setError] = useState('');

  // Reset state every time the modal opens
  useEffect(() => {
    if (visible) {
      setMode('friendly');
      setBetText('');
      setError('');
    }
  }, [visible]);

  const available = wallet?.availableBalanceSats ?? 0;
  const bet = parseInt(betText, 10) || 0;

  // Show balance error inline as user types
  const balanceError =
    mode === 'bet' && bet > 0 && bet > available
      ? t('createGame.errors.insufficientBalance')
      : '';

  const canCreate =
    mode === 'friendly' ||
    (mode === 'bet' && bet > 0 && bet <= available);

  const handleCreate = () => {
    if (mode === 'bet') {
      if (bet <= 0) {
        setError(t('createGame.errors.invalidAmount'));
        return;
      }
      if (bet > available) {
        setError(t('createGame.errors.insufficientBalance'));
        return;
      }
    }
    setError('');
    onConfirm(mode === 'friendly' ? 0 : bet);
  };

  return {
    mode, setMode,
    betText, setBetText,
    error: error || balanceError,
    available,
    canCreate,
    handleCreate,
    onClose,
  };
}
