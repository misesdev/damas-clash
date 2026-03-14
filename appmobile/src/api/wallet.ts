import {request} from './client';
import type {WalletResponse, LedgerEntryResponse, DepositInitiatedResponse, DepositStatusResponse, WithdrawResponse} from '../types/wallet';

const auth = (token: string) => ({Authorization: `Bearer ${token}`});

export const getWallet = (token: string) =>
  request<WalletResponse>('/api/wallet', {headers: auth(token)});

export const getTransactions = (token: string) =>
  request<LedgerEntryResponse[]>('/api/wallet/transactions', {headers: auth(token)});

export const initiateDeposit = (token: string, amountSats: number, memo?: string) =>
  request<DepositInitiatedResponse>('/api/wallet/deposit', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({amountSats, memo}),
  });

export const checkDepositStatus = (token: string, rHash: string) =>
  request<DepositStatusResponse>(`/api/wallet/deposit/${rHash}/status`, {headers: auth(token)});

export const withdraw = (token: string, invoice: string, amountSats: number, maxFeeSats: number = 10) =>
  request<WithdrawResponse>('/api/wallet/withdraw', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({invoice, amountSats, maxFeeSats}),
  });

export const withdrawToAddress = (token: string, amountSats: number, targetAddress?: string, maxFeeSats: number = 10) =>
  request<WithdrawResponse>('/api/wallet/withdraw-to-address', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({amountSats, maxFeeSats, ...(targetAddress ? {targetAddress} : {})}),
  });
