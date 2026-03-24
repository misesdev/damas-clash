import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {NostrRegisterScreen} from '../src/screens/NostrRegisterScreen';

// ── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../src/api/auth');
jest.mock('../src/api/players');
jest.mock('../src/services/nostr/sharedAuthRelays', () => ({
  getAuthRelayPool: jest.fn(),
  connectAuthRelays: jest.fn(),
  disconnectAuthRelays: jest.fn(),
}));

// Partial mock: keep the real module's existing exports, replace only the new ones
jest.mock('../src/utils/nostr', () => ({
  ...jest.requireActual('../src/utils/nostr'),
  generateNewKey: jest.fn(),
  publishNostrProfile: jest.fn(),
  signChallenge: jest.fn(),
  getPubkey: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

import * as authApi from '../src/api/auth';
import * as playersApi from '../src/api/players';
import * as nostrUtils from '../src/utils/nostr';
import * as sharedRelays from '../src/services/nostr/sharedAuthRelays';
import {launchImageLibrary} from 'react-native-image-picker';

const mockNostrChallenge = authApi.nostrChallenge as jest.MockedFunction<typeof authApi.nostrChallenge>;
const mockNostrLogin = authApi.nostrLogin as jest.MockedFunction<typeof authApi.nostrLogin>;
const mockUpdateAvatar = playersApi.updateAvatar as jest.MockedFunction<typeof playersApi.updateAvatar>;
const mockGenerateNewKey = nostrUtils.generateNewKey as jest.MockedFunction<typeof nostrUtils.generateNewKey>;
const mockPublishNostrProfile = nostrUtils.publishNostrProfile as jest.MockedFunction<typeof nostrUtils.publishNostrProfile>;
const mockSignChallenge = nostrUtils.signChallenge as jest.MockedFunction<typeof nostrUtils.signChallenge>;
const mockGetPubkey = nostrUtils.getPubkey as jest.MockedFunction<typeof nostrUtils.getPubkey>;
const mockGetAuthRelayPool = sharedRelays.getAuthRelayPool as jest.MockedFunction<typeof sharedRelays.getAuthRelayPool>;
const mockLaunchImageLibrary = launchImageLibrary as jest.MockedFunction<typeof launchImageLibrary>;

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaView: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

// ── Test data ─────────────────────────────────────────────────────────────────

const FAKE_NSEC = 'nsec1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
const FAKE_PUBKEY_HEX = 'aabbccdd'.repeat(8); // 64-char hex

const fakePairKey = {
  getPublicKeyHex: jest.fn().mockReturnValue(FAKE_PUBKEY_HEX),
  getPrivateKey: jest.fn().mockReturnValue(new Uint8Array(32)),
  signEventId: jest.fn().mockReturnValue('fakesig'.repeat(18).slice(0, 128)),
  toNsec: jest.fn().mockReturnValue(FAKE_NSEC),
};

const fakeLoginResponse = {
  token: 'eyJhbGciOiJIUzI1NiJ9.test',
  refreshToken: 'refresh-tok',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  playerId: 'player-nostr-new',
  username: 'newuser',
  email: null,
  avatarUrl: null,
  nostrPubKey: FAKE_PUBKEY_HEX,
  role: 'Player',
  lightningAddress: null,
};

const defaultProps = {
  onLogin: jest.fn(),
  onBack: jest.fn(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function navigateToProfile(getByTestId: ReturnType<typeof render>['getByTestId']) {
  await waitFor(() => expect(getByTestId('copy-key-button')).toBeTruthy());
  fireEvent.press(getByTestId('copy-key-button'));
  fireEvent.press(getByTestId('saved-checkbox'));
  await waitFor(() =>
    expect(getByTestId('continue-button').props.accessibilityState?.disabled).toBeFalsy(),
  );
  fireEvent.press(getByTestId('continue-button'));
  await waitFor(() => expect(getByTestId('username-input')).toBeTruthy());
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  mockGenerateNewKey.mockReturnValue({pairKey: fakePairKey as any, nsec: FAKE_NSEC});
  mockGetAuthRelayPool.mockReturnValue(null);
  mockNostrChallenge.mockResolvedValue({challenge: 'test-challenge'});
  mockSignChallenge.mockReturnValue('fakesig'.repeat(18).slice(0, 128));
  mockGetPubkey.mockReturnValue(FAKE_PUBKEY_HEX);
  mockNostrLogin.mockResolvedValue(fakeLoginResponse);
  mockPublishNostrProfile.mockResolvedValue(undefined);
  mockUpdateAvatar.mockResolvedValue('https://cdn.example.com/avatar.jpg');
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NostrRegisterScreen', () => {
  it('calls onBack when back button is pressed', async () => {
    const onBack = jest.fn();
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} onBack={onBack} />);

    await waitFor(() => {
      expect(getByTestId('nsec-display')).toBeTruthy();
    });

    fireEvent.press(getByTestId('screen-header-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows the nsec key after generation', async () => {
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} />);

    await waitFor(() => {
      expect(getByTestId('nsec-display')).toBeTruthy();
    });

    expect(getByTestId('nsec-display').props.children).toBe(FAKE_NSEC);
  });

  it('shows the copy button', async () => {
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} />);

    await waitFor(() => {
      expect(getByTestId('copy-key-button')).toBeTruthy();
    });
  });

  it('continue button is disabled before copying and confirming', async () => {
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} />);

    await waitFor(() => {
      expect(getByTestId('continue-button')).toBeTruthy();
    });

    const continueBtn = getByTestId('continue-button');
    expect(continueBtn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it('continue button is enabled after copying key and confirming saved', async () => {
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} />);

    await waitFor(() => {
      expect(getByTestId('copy-key-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('copy-key-button'));
    fireEvent.press(getByTestId('saved-checkbox'));

    await waitFor(() => {
      const continueBtn = getByTestId('continue-button');
      expect(continueBtn.props.accessibilityState?.disabled).toBeFalsy();
    });
  });

  it('navigates to profile step after pressing continue', async () => {
    const {getByTestId, queryByTestId} = render(<NostrRegisterScreen {...defaultProps} />);

    await navigateToProfile(getByTestId);

    expect(queryByTestId('nsec-display')).toBeNull();
    expect(getByTestId('username-input')).toBeTruthy();
  });

  it('shows avatar picker on profile step', async () => {
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} />);
    await navigateToProfile(getByTestId);
    expect(getByTestId('avatar-picker')).toBeTruthy();
  });

  it('opens image library when avatar is pressed', async () => {
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} />);
    await navigateToProfile(getByTestId);

    fireEvent.press(getByTestId('avatar-picker'));
    expect(mockLaunchImageLibrary).toHaveBeenCalledTimes(1);
  });

  it('create account button is disabled when username is too short', async () => {
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} />);
    await navigateToProfile(getByTestId);

    fireEvent.changeText(getByTestId('username-input'), 'ab');

    const createBtn = getByTestId('create-account-button');
    expect(createBtn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it('calls onLogin after successful account creation without avatar', async () => {
    const onLogin = jest.fn();
    const {getByTestId} = render(<NostrRegisterScreen {...defaultProps} onLogin={onLogin} />);

    await navigateToProfile(getByTestId);
    fireEvent.changeText(getByTestId('username-input'), 'newuser');
    fireEvent.press(getByTestId('create-account-button'));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledTimes(1);
    });

    expect(mockNostrChallenge).toHaveBeenCalledWith(FAKE_PUBKEY_HEX);
    expect(mockNostrLogin).toHaveBeenCalledWith(
      expect.objectContaining({username: 'newuser'}),
    );
    expect(mockUpdateAvatar).not.toHaveBeenCalled();
    // nostrNsec must be persisted so the profile screen can show "Copy private key"
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({nostrNsec: FAKE_NSEC}),
    );
  });

  it('shows error message when account creation fails', async () => {
    mockNostrLogin.mockRejectedValueOnce(new Error('server error'));

    const {getByTestId, findByText} = render(<NostrRegisterScreen {...defaultProps} />);
    await navigateToProfile(getByTestId);
    fireEvent.changeText(getByTestId('username-input'), 'newuser');
    fireEvent.press(getByTestId('create-account-button'));

    await findByText('Erro ao criar conta. Tente novamente.');
    expect(defaultProps.onLogin).not.toHaveBeenCalled();
  });
});
