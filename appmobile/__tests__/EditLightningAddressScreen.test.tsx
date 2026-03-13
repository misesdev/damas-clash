import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {EditLightningAddressScreen} from '../src/screens/profile/EditLightningAddressScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key.split('.').pop() ?? key}),
}));

jest.mock('../src/api/players', () => ({
  updateLightningAddress: jest.fn(),
}));

const fakeUser = {
  token: 'tok',
  refreshToken: 'refresh',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  playerId: 'player-1',
  username: 'alice',
  email: 'alice@test.com',
};

describe('EditLightningAddressScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves valid lightning address via API', async () => {
    const {updateLightningAddress} = require('../src/api/players');
    updateLightningAddress.mockResolvedValue({lightningAddress: 'user@wallet.com'});

    const onSaved = jest.fn();
    const {getByTestId} = render(
      <EditLightningAddressScreen
        user={fakeUser}
        initialAddress={null}
        onSaved={onSaved}
        onBack={jest.fn()}
      />,
    );
    fireEvent.changeText(getByTestId('lightning-address-input'), 'user@wallet.com');
    fireEvent.press(getByTestId('save-lightning-btn'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('user@wallet.com'));
  });

  it('shows error for invalid format without calling API', async () => {
    const {updateLightningAddress} = require('../src/api/players');

    const {getByTestId, getByText} = render(
      <EditLightningAddressScreen
        user={fakeUser}
        initialAddress={null}
        onSaved={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    fireEvent.changeText(getByTestId('lightning-address-input'), 'invalid');
    fireEvent.press(getByTestId('save-lightning-btn'));
    await waitFor(() => expect(getByText('invalid')).toBeTruthy());
    expect(updateLightningAddress).not.toHaveBeenCalled();
  });

  it('shows API error when address is unreachable', async () => {
    const {updateLightningAddress} = require('../src/api/players');
    updateLightningAddress.mockRejectedValue({message: 'unreachable'});

    const {getByTestId, getByText} = render(
      <EditLightningAddressScreen
        user={fakeUser}
        initialAddress={null}
        onSaved={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    fireEvent.changeText(getByTestId('lightning-address-input'), 'user@fakewallet.com');
    fireEvent.press(getByTestId('save-lightning-btn'));
    await waitFor(() => expect(getByText('unreachable')).toBeTruthy());
  });
});
