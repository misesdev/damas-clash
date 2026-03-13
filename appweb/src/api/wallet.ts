import { request } from './client';
import type {
  DepositInitiatedResponse,
  DepositStatusResponse,
  LedgerEntry,
  WalletResponse,
  WithdrawResponse,
} from '../types/wallet';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getWallet = (token: string): Promise<WalletResponse> =>
  request('/api/wallet', { headers: auth(token) });

export const getTransactions = (token: string): Promise<LedgerEntry[]> =>
  request('/api/wallet/transactions', { headers: auth(token) });

export const initiateDeposit = (
  token: string,
  amountSats: number,
  memo?: string,
): Promise<DepositInitiatedResponse> =>
  request('/api/wallet/deposit', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ amountSats, memo }),
  });

export const checkDepositStatus = (
  token: string,
  rHash: string,
): Promise<DepositStatusResponse> =>
  request(`/api/wallet/deposit/${encodeURIComponent(rHash)}/status`, {
    headers: auth(token),
  });

export const withdraw = (
  token: string,
  invoice: string,
  amountSats?: number,
  maxFeeSats?: number,
): Promise<WithdrawResponse> =>
  request('/api/wallet/withdraw', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ invoice, amountSats, maxFeeSats }),
  });

export const withdrawToAddress = (
  token: string,
  amountSats: number,
  maxFeeSats?: number,
): Promise<WithdrawResponse> =>
  request('/api/wallet/withdraw-to-address', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ amountSats, maxFeeSats }),
  });
