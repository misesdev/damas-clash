import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {DepositScreen} from '../src/screens/wallet/DepositScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string, opts?: any) => {
    if (key === 'deposit.successMessage') {return `${opts?.amount} sats creditados`;}
    return key.split('.').pop() ?? key;
  }}),
}));

jest.mock('../src/api/wallet', () => ({
  initiateDeposit: jest.fn().mockResolvedValue({
    paymentId: 'pid-1',
    invoice: 'lnbcrt1_test_invoice_very_long_string',
    rHash: 'hash001',
    expiresAt: 9999999999,
  }),
  checkDepositStatus: jest.fn().mockResolvedValue({status: 'OPEN', amountSats: 1000, credited: false}),
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Clipboard = {setString: jest.fn()};
  return rn;
});

const user = {token: 'tok', refreshToken: 'ref', expiresAt: '', playerId: 'p1', username: 'user', email: 'e@e.com', avatarUrl: null};

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
});
