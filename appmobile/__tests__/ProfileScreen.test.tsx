import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {ProfileScreen} from '../src/screens/ProfileScreen';

// ── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../src/api/games', () => ({
  getPlayerStats: jest.fn().mockResolvedValue({total: 5, wins: 3, losses: 2}),
}));
jest.mock('../src/api/auth', () => ({deleteAccount: jest.fn()}));
jest.mock('../src/api/players', () => ({updateAvatar: jest.fn()}));
jest.mock('react-native-image-picker', () => ({launchImageLibrary: jest.fn()}));
jest.mock('../src/storage/nostrKeys', () => ({
  hasBiometry: jest.fn(),
  getProtectedNsec: jest.fn(),
  saveProtectedNsec: jest.fn(),
  clearProtectedNsec: jest.fn(),
}));
jest.mock('../src/utils/nostr', () => ({
  ...jest.requireActual('../src/utils/nostr'),
  pubkeyToNpub: jest.fn((hex: string) => `npub1fake${hex.slice(0, 8)}`),
  pubkeyToShortNpub: jest.fn(() => 'npub1abcd...efgh'),
}));

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaView: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

import * as nostrKeys from '../src/storage/nostrKeys';
const mockHasBiometry = nostrKeys.hasBiometry as jest.MockedFunction<typeof nostrKeys.hasBiometry>;
const mockGetProtectedNsec = nostrKeys.getProtectedNsec as jest.MockedFunction<typeof nostrKeys.getProtectedNsec>;

// ── Shared test data ──────────────────────────────────────────────────────────

const FAKE_PUBKEY = 'aabbccdd'.repeat(8);
const FAKE_NSEC = 'nsec1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';

const fakeRefreshTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();

const emailUser = {
  token: 'tok',
  refreshToken: 'ref',
  expiresAt: fakeRefreshTime,
  playerId: 'p1',
  username: 'alice',
  email: 'alice@example.com',
  avatarUrl: null,
  nostrPubKey: null,
  nostrNsec: null,
  role: 'Player',
  lightningAddress: null,
};

const nostrUser = {
  ...emailUser,
  email: null,
  nostrPubKey: FAKE_PUBKEY,
  nostrNsec: FAKE_NSEC,
};

const nostrUserNoNsec = {
  ...nostrUser,
  nostrNsec: null,
};

const defaultProps = {
  user: emailUser,
  onLogout: jest.fn(),
  onEditUsername: jest.fn(),
  onEditEmail: jest.fn(),
  onAvatarChanged: jest.fn(),
  onOpenHistory: jest.fn(),
  lightningAddress: null,
  onEditLightningAddress: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockHasBiometry.mockResolvedValue(false);
  mockGetProtectedNsec.mockResolvedValue(null);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProfileScreen — email user', () => {
  it('shows email menu item', async () => {
    const {getByTestId} = render(<ProfileScreen {...defaultProps} />);
    await waitFor(() => expect(getByTestId('email-item')).toBeTruthy());
  });

  it('does not show Nostr key items', async () => {
    const {queryByTestId} = render(<ProfileScreen {...defaultProps} />);
    await waitFor(() => {});
    expect(queryByTestId('copy-npub-button')).toBeNull();
    expect(queryByTestId('copy-nsec-button')).toBeNull();
  });
});

describe('ProfileScreen — Nostr user', () => {
  it('hides email menu item', async () => {
    const {queryByTestId} = render(
      <ProfileScreen {...defaultProps} user={nostrUser} />,
    );
    await waitFor(() => {});
    expect(queryByTestId('email-item')).toBeNull();
  });

  it('shows copy public key button', async () => {
    const {getByTestId} = render(
      <ProfileScreen {...defaultProps} user={nostrUser} />,
    );
    await waitFor(() => expect(getByTestId('copy-npub-button')).toBeTruthy());
  });

  it('shows copy private key button when nsec is present', async () => {
    const {getByTestId} = render(
      <ProfileScreen {...defaultProps} user={nostrUser} />,
    );
    await waitFor(() => expect(getByTestId('copy-nsec-button')).toBeTruthy());
  });

  it('does not show copy private key button when nsec is absent', async () => {
    const {queryByTestId} = render(
      <ProfileScreen {...defaultProps} user={nostrUserNoNsec} />,
    );
    await waitFor(() => {});
    expect(queryByTestId('copy-nsec-button')).toBeNull();
  });

  it('copies npub to clipboard when copy public key is pressed', async () => {
    const {Clipboard} = require('react-native');
    const {getByTestId} = render(
      <ProfileScreen {...defaultProps} user={nostrUser} />,
    );
    await waitFor(() => expect(getByTestId('copy-npub-button')).toBeTruthy());
    fireEvent.press(getByTestId('copy-npub-button'));
    expect(Clipboard.setString).toHaveBeenCalledWith(
      expect.stringContaining('npub1'),
    );
  });

  it('copies nsec directly when no biometry available', async () => {
    mockHasBiometry.mockResolvedValue(false);
    const {Clipboard} = require('react-native');
    const {getByTestId} = render(
      <ProfileScreen {...defaultProps} user={nostrUser} />,
    );
    await waitFor(() => expect(getByTestId('copy-nsec-button')).toBeTruthy());
    fireEvent.press(getByTestId('copy-nsec-button'));
    await waitFor(() => {
      expect(Clipboard.setString).toHaveBeenCalledWith(FAKE_NSEC);
    });
  });

  it('uses biometric protected nsec when biometry is available', async () => {
    const PROTECTED_NSEC = 'nsec1protected_value';
    mockHasBiometry.mockResolvedValue(true);
    mockGetProtectedNsec.mockResolvedValue(PROTECTED_NSEC);
    const {Clipboard} = require('react-native');
    const {getByTestId} = render(
      <ProfileScreen {...defaultProps} user={nostrUser} />,
    );
    await waitFor(() => expect(getByTestId('copy-nsec-button')).toBeTruthy());
    fireEvent.press(getByTestId('copy-nsec-button'));
    await waitFor(() => {
      expect(mockGetProtectedNsec).toHaveBeenCalledTimes(1);
      expect(Clipboard.setString).toHaveBeenCalledWith(PROTECTED_NSEC);
    });
  });

  it('does not copy when biometrics are cancelled', async () => {
    mockHasBiometry.mockResolvedValue(true);
    mockGetProtectedNsec.mockResolvedValue(null); // user cancelled
    const {Clipboard} = require('react-native');
    const {getByTestId} = render(
      <ProfileScreen {...defaultProps} user={nostrUser} />,
    );
    await waitFor(() => expect(getByTestId('copy-nsec-button')).toBeTruthy());
    fireEvent.press(getByTestId('copy-nsec-button'));
    await waitFor(() => {
      expect(mockGetProtectedNsec).toHaveBeenCalledTimes(1);
    });
    expect(Clipboard.setString).not.toHaveBeenCalled();
  });
});
