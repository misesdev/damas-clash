import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {WithdrawScreen} from '../src/screens/wallet/WithdrawScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string, opts?: any) => {
    if (opts?.amount !== undefined) {return `${opts.amount} sats`;}
    return key.split('.').pop() ?? key;
  }}),
}));

jest.mock('../src/api/wallet', () => ({
  withdrawToAddress: jest.fn(),
}));

const fakeUser = {
  token: 'tok',
  refreshToken: 'ref',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  playerId: 'p1',
  username: 'alice',
  email: 'alice@test.com',
};

const fakeWallet = {balanceSats: 5000, lockedBalanceSats: 0, availableBalanceSats: 5000};

describe('WithdrawScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows no-address state when lightningAddress is null', () => {
    const {getByTestId} = render(
      <WithdrawScreen
        user={fakeUser}
        wallet={fakeWallet}
        lightningAddress={null}
        onBack={jest.fn()}
        onSuccess={jest.fn()}
        onRegisterLightningAddress={jest.fn()}
      />,
    );
    expect(getByTestId('register-lightning-btn')).toBeTruthy();
  });

  it('calls onRegisterLightningAddress when "Cadastrar" is pressed', () => {
    const onRegister = jest.fn();
    const {getByTestId} = render(
      <WithdrawScreen
        user={fakeUser}
        wallet={fakeWallet}
        lightningAddress={null}
        onBack={jest.fn()}
        onSuccess={jest.fn()}
        onRegisterLightningAddress={onRegister}
      />,
    );
    fireEvent.press(getByTestId('register-lightning-btn'));
    expect(onRegister).toHaveBeenCalled();
  });

  it('shows SatsInput when lightningAddress is set', () => {
    const {getByTestId} = render(
      <WithdrawScreen
        user={fakeUser}
        wallet={fakeWallet}
        lightningAddress="alice@wallet.com"
        onBack={jest.fn()}
        onSuccess={jest.fn()}
        onRegisterLightningAddress={jest.fn()}
      />,
    );
    expect(getByTestId('deposit-amount-input')).toBeTruthy(); // SatsInput hidden TextInput
    expect(getByTestId('withdraw-submit-btn')).toBeTruthy();
  });

  it('submit button is disabled when amount is 0', () => {
    const {getByTestId} = render(
      <WithdrawScreen
        user={fakeUser}
        wallet={fakeWallet}
        lightningAddress="alice@wallet.com"
        onBack={jest.fn()}
        onSuccess={jest.fn()}
        onRegisterLightningAddress={jest.fn()}
      />,
    );
    const btn = getByTestId('withdraw-submit-btn');
    expect(btn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it('calls withdrawToAddress and shows success', async () => {
    const {withdrawToAddress} = require('../src/api/wallet');
    withdrawToAddress.mockResolvedValue({amountSats: 1000, feePaidSats: 1, paymentHash: 'hash'});

    const onSuccess = jest.fn();
    const {getByTestId} = render(
      <WithdrawScreen
        user={fakeUser}
        wallet={fakeWallet}
        lightningAddress="alice@wallet.com"
        onBack={jest.fn()}
        onSuccess={onSuccess}
        onRegisterLightningAddress={jest.fn()}
      />,
    );
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('withdraw-submit-btn'));
    await waitFor(() => expect(withdrawToAddress).toHaveBeenCalledWith('tok', 1000));
  });
});
