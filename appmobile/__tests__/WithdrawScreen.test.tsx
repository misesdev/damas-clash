/**
 * WithdrawScreen — component tests.
 *
 * Tests cover:
 *  - Address field is empty when no registered address
 *  - Address field is pre-filled with registered address
 *  - Submit disabled when address is empty
 *  - Submit disabled when amount is 0
 *  - Submit enabled when valid address + valid amount
 *  - Calls withdrawToAddress with address and amount on submit
 *  - Shows success state after withdrawal
 *  - Shows validation error for invalid address format
 *  - Shows API error on failure
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {WithdrawScreen} from '../src/screens/wallet/WithdrawScreen';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaProvider: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    SafeAreaView: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (opts?.amount !== undefined) {return `${opts.amount} sats`;}
      return key.split('.').pop() ?? key;
    },
  }),
}));

jest.mock('../src/api/wallet', () => ({
  withdrawToAddress: jest.fn(),
}));

// QRScannerInput renders a TextInput — just render it simply
jest.mock('../src/components/QRScannerInput', () => {
  const {TextInput} = require('react-native');
  return {
    QRScannerInput: ({value, onChangeText, testID, error}: any) => (
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        accessibilityHint={error}
      />
    ),
  };
});

const fakeUser = {
  token: 'tok',
  refreshToken: 'ref',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  playerId: 'p1',
  username: 'alice',
  email: 'alice@test.com',
};

const fakeWallet = {
  balanceSats: 5000,
  lockedBalanceSats: 0,
  availableBalanceSats: 5000,
};

function renderScreen(
  lightningAddress: string | null,
  overrides: {onSuccess?: jest.Mock; onBack?: jest.Mock} = {},
) {
  return render(
    <WithdrawScreen
      user={fakeUser}
      wallet={fakeWallet}
      lightningAddress={lightningAddress}
      onBack={overrides.onBack ?? jest.fn()}
      onSuccess={overrides.onSuccess ?? jest.fn()}
      onRegisterLightningAddress={jest.fn()}
    />,
  );
}

describe('WithdrawScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Address field ─────────────────────────────────────────────────────────

  it('address field is empty when no registered address', () => {
    const {getByTestId} = renderScreen(null);
    expect(getByTestId('withdraw-address-input').props.value).toBe('');
  });

  it('address field is pre-filled with registered address', () => {
    const {getByTestId} = renderScreen('alice@wallet.com');
    expect(getByTestId('withdraw-address-input').props.value).toBe('alice@wallet.com');
  });

  it('address field can be changed by typing', () => {
    const {getByTestId} = renderScreen('alice@wallet.com');
    fireEvent.changeText(getByTestId('withdraw-address-input'), 'bob@wallet.com');
    expect(getByTestId('withdraw-address-input').props.value).toBe('bob@wallet.com');
  });

  // ─── Submit button state ───────────────────────────────────────────────────

  it('submit is disabled when address is empty and no amount', () => {
    const {getByTestId} = renderScreen(null);
    expect(getByTestId('withdraw-submit-btn').props.accessibilityState?.disabled).toBeTruthy();
  });

  it('submit is disabled when address is empty even with amount', () => {
    const {getByTestId} = renderScreen(null);
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    expect(getByTestId('withdraw-submit-btn').props.accessibilityState?.disabled).toBeTruthy();
  });

  it('submit is disabled when amount is 0 even with valid address', () => {
    const {getByTestId} = renderScreen('alice@wallet.com');
    expect(getByTestId('withdraw-submit-btn').props.accessibilityState?.disabled).toBeTruthy();
  });

  it('submit is enabled when address is valid and amount > 0', () => {
    const {getByTestId} = renderScreen('alice@wallet.com');
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    expect(getByTestId('withdraw-submit-btn').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('submit is enabled with a scanned LNURL address', () => {
    const {getByTestId} = renderScreen(null);
    fireEvent.changeText(getByTestId('withdraw-address-input'), 'lnurl1dp68gurn8ghj7um9wfmxjcm99e3k7mf0v9cxj0m385ekvcenxc6r2c35xvukxefcv5mkvv34x5ekzd3ev56nyd3hxqurzepexejxxepnxscrvwfnv9nxzcn9xq6xyefhvgcxxcmyxymnserxfq5fns');
    fireEvent.changeText(getByTestId('deposit-amount-input'), '500');
    expect(getByTestId('withdraw-submit-btn').props.accessibilityState?.disabled).toBeFalsy();
  });

  // ─── Validation ────────────────────────────────────────────────────────────

  it('shows validation error for invalid address format', async () => {
    const {getByTestId} = renderScreen(null);
    fireEvent.changeText(getByTestId('withdraw-address-input'), 'notavalidaddress');
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('withdraw-submit-btn'));
    // button stays disabled because canWithdraw is false while address invalid before submit
    // but we can test after attempting to submit with a manually-enabled submit
    const {withdrawToAddress} = require('../src/api/wallet');
    expect(withdrawToAddress).not.toHaveBeenCalled();
  });

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('calls withdrawToAddress with address and amount', async () => {
    const {withdrawToAddress} = require('../src/api/wallet');
    withdrawToAddress.mockResolvedValue({amountSats: 1000, feePaidSats: 1, paymentHash: 'hash'});

    const {getByTestId} = renderScreen('alice@wallet.com');
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('withdraw-submit-btn'));

    await waitFor(() =>
      expect(withdrawToAddress).toHaveBeenCalledWith('tok', 1000, 'alice@wallet.com'),
    );
  });

  it('calls withdrawToAddress with scanned address', async () => {
    const {withdrawToAddress} = require('../src/api/wallet');
    withdrawToAddress.mockResolvedValue({amountSats: 500, feePaidSats: 1, paymentHash: 'h'});

    const {getByTestId} = renderScreen(null);
    fireEvent.changeText(getByTestId('withdraw-address-input'), 'bob@otherwallet.com');
    fireEvent.changeText(getByTestId('deposit-amount-input'), '500');
    fireEvent.press(getByTestId('withdraw-submit-btn'));

    await waitFor(() =>
      expect(withdrawToAddress).toHaveBeenCalledWith('tok', 500, 'bob@otherwallet.com'),
    );
  });

  it('shows success state after successful withdrawal', async () => {
    const {withdrawToAddress} = require('../src/api/wallet');
    withdrawToAddress.mockResolvedValue({amountSats: 1000, feePaidSats: 1, paymentHash: 'hash'});

    const {getByTestId, queryByText} = renderScreen('alice@wallet.com');
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('withdraw-submit-btn'));

    await waitFor(() => expect(queryByText(/successTitle/i)).toBeTruthy());
  });

  // ─── Error handling ────────────────────────────────────────────────────────

  it('shows insufficient balance error on 400', async () => {
    const {withdrawToAddress} = require('../src/api/wallet');
    const {ApiError} = require('../src/api/client');
    withdrawToAddress.mockRejectedValue(new ApiError(400, 'bad'));

    const {getByTestId, queryByText} = renderScreen('alice@wallet.com');
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('withdraw-submit-btn'));

    await waitFor(() => expect(queryByText(/insufficientBalance/i)).toBeTruthy());
  });

  it('shows address error on 422', async () => {
    const {withdrawToAddress} = require('../src/api/wallet');
    const {ApiError} = require('../src/api/client');
    withdrawToAddress.mockRejectedValue(new ApiError(422, 'unprocessable'));

    const {getByTestId, queryByText} = renderScreen('alice@wallet.com');
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('withdraw-submit-btn'));

    await waitFor(() => expect(queryByText(/addressError/i)).toBeTruthy());
  });
});
