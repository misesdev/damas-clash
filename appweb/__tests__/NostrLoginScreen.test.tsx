import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Mock i18n module
jest.mock('../src/i18n', () => ({ default: { t: (k: string) => k } }));

// Mock NostrAuthService
jest.mock('../src/services/nostr/NostrAuthService', () => ({
  NostrAuthService: {
    authenticate: jest.fn(),
  },
  NostrKey: {
    validateNsec: jest.fn((val: string) => val.startsWith('nsec1')),
    fromNsec: jest.fn(),
  },
}));

import { NostrLoginScreen } from '../src/screens/NostrLoginScreen';
import { NostrAuthService } from '../src/services/nostr/NostrAuthService';

const mockOnLogin = jest.fn();
const mockOnBack = jest.fn();

describe('NostrLoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the nsec input and login button', () => {
    render(<NostrLoginScreen onLogin={mockOnLogin} onBack={mockOnBack} />);
    expect(screen.getByPlaceholderText('nsec1...')).toBeInTheDocument();
    expect(screen.getByText('nostrLogin_loginButton')).toBeInTheDocument();
  });

  it('button is disabled when input is empty', () => {
    render(<NostrLoginScreen onLogin={mockOnLogin} onBack={mockOnBack} />);
    const button = screen.getByText('nostrLogin_loginButton').closest('button');
    expect(button).toBeDisabled();
  });

  it('button is disabled when input does not start with nsec1', () => {
    render(<NostrLoginScreen onLogin={mockOnLogin} onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText('nsec1...');
    fireEvent.change(input, { target: { value: 'invalidkey' } });
    const button = screen.getByText('nostrLogin_loginButton').closest('button');
    expect(button).toBeDisabled();
  });

  it('button is enabled when input starts with nsec1', () => {
    render(<NostrLoginScreen onLogin={mockOnLogin} onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText('nsec1...');
    fireEvent.change(input, { target: { value: 'nsec1validkeyhere' } });
    const button = screen.getByText('nostrLogin_loginButton').closest('button');
    expect(button).not.toBeDisabled();
  });

  it('shows error message on auth failure', async () => {
    (NostrAuthService.authenticate as jest.Mock).mockRejectedValue(new Error('auth failed'));
    render(<NostrLoginScreen onLogin={mockOnLogin} onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText('nsec1...');
    fireEvent.change(input, { target: { value: 'nsec1validkeyhere' } });
    const button = screen.getByText('nostrLogin_loginButton').closest('button')!;
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('nostrLogin_errorAuthFailed')).toBeInTheDocument();
    });
  });

  it('calls onLogin on success', async () => {
    const fakeData = { token: 'tok', refreshToken: 'ref', expiresAt: '2030-01-01', playerId: '1', username: 'user', email: null };
    (NostrAuthService.authenticate as jest.Mock).mockResolvedValue(fakeData);
    render(<NostrLoginScreen onLogin={mockOnLogin} onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText('nsec1...');
    fireEvent.change(input, { target: { value: 'nsec1validkeyhere' } });
    const button = screen.getByText('nostrLogin_loginButton').closest('button')!;
    fireEvent.click(button);
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith(fakeData);
    });
  });
});
