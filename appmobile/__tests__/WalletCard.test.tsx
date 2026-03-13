import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {WalletCard} from '../src/components/WalletCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string, opts?: any) => {
    if (key === 'wallet.unit') {return 'sats';}
    if (key === 'wallet.balance') {return 'Saldo disponível';}
    if (key === 'wallet.depositButton') {return 'Depositar';}
    if (key === 'wallet.withdrawButton') {return 'Sacar';}
    if (key === 'wallet.lockedLabel') {return `${opts?.amount} bloqueados`;}
    return key;
  }}),
}));

const mockWallet = {balanceSats: 5000, lockedBalanceSats: 1000, availableBalanceSats: 4000};

describe('WalletCard', () => {
  it('renders balance correctly', () => {
    const {getByTestId} = render(
      <WalletCard wallet={mockWallet} onDeposit={jest.fn()} onWithdraw={jest.fn()} />,
    );
    expect(getByTestId('wallet-balance').props.children).toBe('4,000');
  });

  it('calls onDeposit when deposit button pressed', () => {
    const onDeposit = jest.fn();
    const {getByTestId} = render(
      <WalletCard wallet={mockWallet} onDeposit={onDeposit} onWithdraw={jest.fn()} />,
    );
    fireEvent.press(getByTestId('wallet-deposit-btn'));
    expect(onDeposit).toHaveBeenCalledTimes(1);
  });

  it('calls onWithdraw when withdraw button pressed', () => {
    const onWithdraw = jest.fn();
    const {getByTestId} = render(
      <WalletCard wallet={mockWallet} onDeposit={jest.fn()} onWithdraw={onWithdraw} />,
    );
    fireEvent.press(getByTestId('wallet-withdraw-btn'));
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  it('renders zero balance when wallet is null', () => {
    const {getByTestId} = render(
      <WalletCard wallet={null} onDeposit={jest.fn()} onWithdraw={jest.fn()} />,
    );
    expect(getByTestId('wallet-balance').props.children).toBe('0');
  });
});
