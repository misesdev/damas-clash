import React from 'react';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import {DepositScreen} from '../src/screens/wallet/DepositScreen';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaProvider: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    SafeAreaView: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

jest.mock('react-native-qrcode-svg', () => 'QRCode');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string, opts?: any) => {
    if (key === 'deposit.successMessage') {return `${opts?.amount} sats creditados`;}
    return key.split('.').pop() ?? key;
  }}),
}));

const mockCheckDepositStatus = jest.fn();
jest.mock('../src/api/wallet', () => ({
  initiateDeposit: jest.fn().mockResolvedValue({
    paymentId: 'pid-1',
    invoice: 'lnbcrt1_test_invoice_very_long_string',
    rHash: 'hash001',
    expiresAt: 9999999999,
  }),
  checkDepositStatus: (...args: any[]) => mockCheckDepositStatus(...args),
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Clipboard = {setString: jest.fn()};
  return rn;
});

const user = {token: 'tok', refreshToken: 'ref', expiresAt: '', playerId: 'p1', username: 'user', email: 'e@e.com', avatarUrl: null};

beforeEach(() => {
  jest.useFakeTimers();
  mockCheckDepositStatus.mockResolvedValue({status: 'OPEN', amountSats: 1000, credited: false});
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('DepositScreen', () => {
  it('renders amount input initially', () => {
    const {getByTestId} = render(
      <DepositScreen user={user} onBack={jest.fn()} onSuccess={jest.fn()} />,
    );
    expect(getByTestId('deposit-amount-input')).toBeTruthy();
  });

  it('shows invoice after submitting valid amount', async () => {
    const {getByTestId, queryByTestId} = render(
      <DepositScreen user={user} onBack={jest.fn()} onSuccess={jest.fn()} />,
    );
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('deposit-submit-btn'));
    await waitFor(() => expect(queryByTestId('copy-invoice-btn')).toBeTruthy());
  });

  it('shows success screen and calls onSuccess when payment is credited', async () => {
    mockCheckDepositStatus.mockResolvedValue({status: 'SETTLED', amountSats: 1000, credited: true});
    const onSuccess = jest.fn();

    const {getByTestId, findByText} = render(
      <DepositScreen user={user} onBack={jest.fn()} onSuccess={onSuccess} />,
    );

    // Enter amount and submit to initiate deposit
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('deposit-submit-btn'));

    // Wait for invoice step, then advance timer to trigger first poll
    await waitFor(() => expect(getByTestId('copy-invoice-btn')).toBeTruthy());
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    // Success screen should appear
    await findByText('successTitle');

    // onSuccess should be called after 2.5s delay
    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('does not fire concurrent polls when previous check is still in-flight', async () => {
    // Simulate a slow API call: never resolves during the test
    let resolveCheck: (v: any) => void = () => {};
    mockCheckDepositStatus.mockReturnValue(
      new Promise(resolve => { resolveCheck = resolve; }),
    );

    const {getByTestId} = render(
      <DepositScreen user={user} onBack={jest.fn()} onSuccess={jest.fn()} />,
    );
    fireEvent.changeText(getByTestId('deposit-amount-input'), '1000');
    fireEvent.press(getByTestId('deposit-submit-btn'));
    await waitFor(() => expect(getByTestId('copy-invoice-btn')).toBeTruthy());

    // Advance past multiple poll intervals
    await act(async () => {
      jest.advanceTimersByTime(3000); // 1st tick fires
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(3000); // 2nd tick — should be skipped by isCheckingRef
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(3000); // 3rd tick — also skipped
      await Promise.resolve();
    });

    // Only one request should have been made
    expect(mockCheckDepositStatus).toHaveBeenCalledTimes(1);

    // Cleanup: resolve the pending promise
    resolveCheck({status: 'OPEN', amountSats: 1000, credited: false});
  });
});
