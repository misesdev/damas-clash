import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {NostrLoginScreen} from '../src/screens/NostrLoginScreen';

// ── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../src/api/auth');
jest.mock('../src/services/nostr/AppSigner');
jest.mock('../src/utils/nostr');

import * as authApi from '../src/api/auth';
import * as AppSignerModule from '../src/services/nostr/AppSigner';
import * as nostrUtils from '../src/utils/nostr';

const mockNostrChallenge = authApi.nostrChallenge as jest.MockedFunction<typeof authApi.nostrChallenge>;
const mockNostrEventLogin = authApi.nostrEventLogin as jest.MockedFunction<typeof authApi.nostrEventLogin>;
const mockNostrLogin = authApi.nostrLogin as jest.MockedFunction<typeof authApi.nostrLogin>;
const mockGetPublicKey = AppSignerModule.appSignerGetPublicKey as jest.MockedFunction<typeof AppSignerModule.appSignerGetPublicKey>;
const mockSignEvent = AppSignerModule.appSignerSignEvent as jest.MockedFunction<typeof AppSignerModule.appSignerSignEvent>;
const mockNpubToHex = nostrUtils.npubToHex as jest.MockedFunction<typeof nostrUtils.npubToHex>;
const mockFetchProfile = nostrUtils.fetchNostrProfile as jest.MockedFunction<typeof nostrUtils.fetchNostrProfile>;

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaView: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

// ── Test data ─────────────────────────────────────────────────────────────────

const FAKE_NPUB = 'npub1testpubkey123';
const FAKE_PUBKEY_HEX = 'aabbccdd'.repeat(8); // 64-char hex
const FAKE_SIGNER_PACKAGE = 'com.greenart7c3.nostrsigner';

const fakeSignedEvent = {
  id: 'eventid'.repeat(9).slice(0, 64),
  pubkey: FAKE_PUBKEY_HEX,
  created_at: Math.floor(Date.now() / 1000),
  kind: 22242,
  tags: [['challenge', 'test-challenge']],
  content: 'Damas Clash authentication',
  sig: 'signature'.repeat(8).slice(0, 128),
};

const fakeLoginResponse = {
  token: 'eyJhbGciOiJIUzI1NiJ9.test',
  refreshToken: 'refresh-tok',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  playerId: 'player-nostr-id',
  username: 'nostruser',
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

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  mockNpubToHex.mockReturnValue(FAKE_PUBKEY_HEX);
  mockFetchProfile.mockResolvedValue({});
  mockNostrChallenge.mockResolvedValue({challenge: 'test-challenge'});
  mockGetPublicKey.mockResolvedValue({npub: FAKE_NPUB, package: FAKE_SIGNER_PACKAGE});
  mockSignEvent.mockResolvedValue(fakeSignedEvent);
  mockNostrEventLogin.mockResolvedValue(fakeLoginResponse);
  mockNostrLogin.mockResolvedValue(fakeLoginResponse);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NostrLoginScreen', () => {
  it('renders the signer login button', () => {
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} />);
    expect(getByTestId('signer-login-button')).toBeTruthy();
  });

  it('renders the nsec input', () => {
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} />);
    expect(getByTestId('nsec-input')).toBeTruthy();
  });

  it('renders the sign-in button', () => {
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} />);
    expect(getByTestId('nostr-login-button')).toBeTruthy();
  });

  it('calls onBack when back button is pressed', () => {
    const onBack = jest.fn();
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} onBack={onBack} />);
    fireEvent.press(getByTestId('screen-header-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  // ── App Signer (NIP-55) flow ────────────────────────────────────────────────

  it('calls onLogin with correct LoginResponse after successful signer login', async () => {
    const onLogin = jest.fn();
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} onLogin={onLogin} />);

    fireEvent.press(getByTestId('signer-login-button'));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledTimes(1);
    });

    expect(onLogin).toHaveBeenCalledWith(fakeLoginResponse);
  });

  it('calls the correct API sequence for signer login', async () => {
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} />);

    fireEvent.press(getByTestId('signer-login-button'));

    await waitFor(() => {
      expect(defaultProps.onLogin).toHaveBeenCalled();
    });

    // 1. Get public key from signer
    expect(mockGetPublicKey).toHaveBeenCalledTimes(1);
    // 2. Convert npub to hex
    expect(mockNpubToHex).toHaveBeenCalledWith(FAKE_NPUB);
    // 3. Get challenge from API
    expect(mockNostrChallenge).toHaveBeenCalledTimes(1);
    // 4. Sign event with signer
    expect(mockSignEvent).toHaveBeenCalledTimes(1);
    const [signedEventArg, pubkeyArg, packageArg] = mockSignEvent.mock.calls[0];
    expect(signedEventArg.kind).toBe(22242);
    expect(signedEventArg.pubkey).toBe(FAKE_PUBKEY_HEX);
    expect(signedEventArg.tags).toEqual([['challenge', 'test-challenge']]);
    expect(pubkeyArg).toBe(FAKE_PUBKEY_HEX);
    expect(packageArg).toBe(FAKE_SIGNER_PACKAGE);
    // 5. Authenticate with API
    expect(mockNostrEventLogin).toHaveBeenCalledTimes(1);
    expect(mockNostrEventLogin).toHaveBeenCalledWith(
      expect.objectContaining({event: fakeSignedEvent}),
    );
  });

  it('returns LoginResponse with null email for Nostr users', async () => {
    const onLogin = jest.fn();
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} onLogin={onLogin} />);

    fireEvent.press(getByTestId('signer-login-button'));

    await waitFor(() => expect(onLogin).toHaveBeenCalled());

    const response = onLogin.mock.calls[0][0];
    expect(response.email).toBeNull();
    expect(response.nostrPubKey).toBe(FAKE_PUBKEY_HEX);
    expect(response.token).toBeTruthy();
    expect(response.playerId).toBeTruthy();
  });

  it('shows error when signer is not available (Android only)', async () => {
    mockGetPublicKey.mockRejectedValueOnce(new Error('app_signer_android_only'));

    const {getByTestId, findByText} = render(<NostrLoginScreen {...defaultProps} />);
    fireEvent.press(getByTestId('signer-login-button'));

    await findByText(/signer/i);
    expect(defaultProps.onLogin).not.toHaveBeenCalled();
  });

  it('does not show error when user rejects the signer request', async () => {
    const rejection = Object.assign(new Error('User rejected'), {code: 'USER_REJECTED'});
    mockGetPublicKey.mockRejectedValueOnce(rejection);

    const {getByTestId, queryByText} = render(<NostrLoginScreen {...defaultProps} />);
    fireEvent.press(getByTestId('signer-login-button'));

    await waitFor(() => {
      // Button returns to idle state
      expect(getByTestId('signer-login-button')).toBeTruthy();
    });
    expect(defaultProps.onLogin).not.toHaveBeenCalled();
    // No error message shown for user-cancelled flows
    expect(queryByText(/authFailed/i)).toBeNull();
  });

  it('shows auth failed error when nostrEventLogin rejects', async () => {
    mockNostrEventLogin.mockRejectedValueOnce(new Error('invalid_signature'));

    const {getByTestId, findByText} = render(<NostrLoginScreen {...defaultProps} />);
    fireEvent.press(getByTestId('signer-login-button'));

    await findByText('Autenticação falhou. Tente novamente.');
    expect(defaultProps.onLogin).not.toHaveBeenCalled();
  });

  // ── nsec login flow ─────────────────────────────────────────────────────────

  it('nsec sign-in button is disabled when input is empty', () => {
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} />);
    const button = getByTestId('nostr-login-button');
    // Button should be disabled with empty nsec
    expect(button.props.accessibilityState?.disabled).toBeTruthy();
  });

  it('nsec sign-in button is disabled when input does not start with nsec1', () => {
    const {getByTestId} = render(<NostrLoginScreen {...defaultProps} />);
    fireEvent.changeText(getByTestId('nsec-input'), 'not_a_valid_nsec');
    const button = getByTestId('nostr-login-button');
    expect(button.props.accessibilityState?.disabled).toBeTruthy();
  });
});
