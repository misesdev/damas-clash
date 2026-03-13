'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  checkDepositStatus,
  getTransactions,
  getWallet,
  initiateDeposit,
  withdrawToAddress,
} from '../api/wallet';
import type { DepositInitiatedResponse, LedgerEntry, WalletResponse } from '../types/wallet';
import type { LoginResponse } from '../types/auth';

type DepositStep = 'idle' | 'invoice' | 'polling' | 'paid';

const POLL_INTERVAL_MS = 3000;
const MAX_FEE_SATS = 10;

export function useWalletScreen(session: LoginResponse, onBalanceChanged: (sats: number) => void) {
  const { t } = useTranslation();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Deposit
  const [depositStep, setDepositStep] = useState<DepositStep>('idle');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositData, setDepositData] = useState<DepositInitiatedResponse | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  // Withdraw to address
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [w, tx] = await Promise.all([
        getWallet(session.token),
        getTransactions(session.token),
      ]);
      setWallet(w);
      setTransactions(tx);
      onBalanceChanged(w.availableBalanceSats);
    } catch {
      // silently ignore
    }
  }, [session.token, onBalanceChanged]);

  useEffect(() => {
    setLoadingWallet(true);
    refresh().finally(() => setLoadingWallet(false));
  }, [refresh]);

  // ── Deposit flow ─────────────────────────────────────────────────────────────

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    isPollingRef.current = false;
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (rHash: string) => {
    setDepositStep('polling');
    isPollingRef.current = false;
    pollRef.current = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const status = await checkDepositStatus(session.token, rHash);
        if (status.credited) {
          stopPolling();
          setDepositStep('paid');
          refresh();
        }
      } catch {
        // keep polling
      } finally {
        isPollingRef.current = false;
      }
    }, POLL_INTERVAL_MS);
  };

  const handleGenerateInvoice = async () => {
    const amount = parseInt(depositAmount, 10);
    if (!amount || amount <= 0) {
      setDepositError(t('wallet_depositErrorAmount'));
      return;
    }
    setDepositLoading(true);
    setDepositError('');
    try {
      const data = await initiateDeposit(session.token, amount);
      setDepositData(data);
      setDepositStep('invoice');
      startPolling(data.rHash);
    } catch {
      setDepositError(t('wallet_depositError'));
    } finally {
      setDepositLoading(false);
    }
  };

  const handleResetDeposit = () => {
    stopPolling();
    setDepositStep('idle');
    setDepositAmount('');
    setDepositData(null);
    setDepositError('');
  };

  const handleCopyInvoice = () => {
    if (depositData?.invoice) navigator.clipboard.writeText(depositData.invoice).catch(() => {});
  };

  // ── Withdraw to Lightning Address ────────────────────────────────────────────

  const handleWithdrawToAddress = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount <= 0) {
      setWithdrawError(t('wallet_withdrawErrorAmount'));
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError('');
    setWithdrawSuccess('');
    try {
      await withdrawToAddress(session.token, amount, MAX_FEE_SATS);
      setWithdrawSuccess(t('wallet_withdrawSuccess'));
      setWithdrawAmount('');
      refresh();
    } catch {
      setWithdrawError(t('wallet_withdrawError'));
    } finally {
      setWithdrawLoading(false);
    }
  };

  return {
    wallet,
    transactions,
    loadingWallet,
    // deposit
    depositStep,
    depositAmount,
    setDepositAmount,
    depositData,
    depositLoading,
    depositError,
    handleGenerateInvoice,
    handleResetDeposit,
    handleCopyInvoice,
    // withdraw
    withdrawAmount,
    setWithdrawAmount,
    withdrawLoading,
    withdrawError,
    withdrawSuccess,
    handleWithdrawToAddress,
  };
}
