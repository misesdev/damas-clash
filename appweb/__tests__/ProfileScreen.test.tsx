import React from 'react';
import { render, screen } from '@testing-library/react';
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
  pubkeyToShortNpub: (hex: string) => `npub1short...testtest`,
}));

// Mock useProfileScreen
jest.mock('../src/hooks/useProfileScreen', () => ({
  useProfileScreen: () => ({
    uploading: false,
    stats: { total: 5, wins: 3, losses: 2 },
    fileInputRef: { current: null },
    handleLogout: jest.fn(),
    handleDeleteAccount: jest.fn(),
    handleAvatarPress: jest.fn(),
    handleFileChange: jest.fn(),
  }),
}));

// Mock LanguageSwitcher
jest.mock('../src/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

import { ProfileScreen } from '../src/screens/ProfileScreen';
import type { LoginResponse } from '../src/types/auth';

const baseUser: LoginResponse = {
  token: 'tok',
  refreshToken: 'ref',
  expiresAt: '2030-01-01',
  playerId: '1',
  username: 'TestUser',
  email: 'test@example.com',
  avatarUrl: null,
  nostrPubKey: null,
  role: 'Player',
};

const mockHandlers = {
  onLogout: jest.fn(),
  onEditUsername: jest.fn(),
  onEditEmail: jest.fn(),
  onAvatarChanged: jest.fn(),
  onOpenHistory: jest.fn(),
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows email for regular users', () => {
    render(<ProfileScreen user={baseUser} {...mockHandlers} />);
    const matches = screen.getAllByText('test@example.com');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows npub for Nostr users', () => {
    const nostrUser: LoginResponse = { ...baseUser, email: null, nostrPubKey: 'abc123def456' };
    render(<ProfileScreen user={nostrUser} {...mockHandlers} />);
    expect(screen.getByText('npub1short...testtest')).toBeInTheDocument();
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('does not show email for user with nostrPubKey set', () => {
    const nostrUser: LoginResponse = { ...baseUser, email: 'hidden@example.com', nostrPubKey: 'abc123def456' };
    render(<ProfileScreen user={nostrUser} {...mockHandlers} />);
    // Should show npub, not email
    expect(screen.getByText('npub1short...testtest')).toBeInTheDocument();
    expect(screen.queryByText('hidden@example.com')).not.toBeInTheDocument();
  });

  it('email menu item has no chevron for Nostr users (not clickable)', () => {
    const nostrUser: LoginResponse = { ...baseUser, email: null, nostrPubKey: 'abc123def456' };
    render(<ProfileScreen user={nostrUser} {...mockHandlers} />);
    // The › chevron should not appear for email item when user is Nostr
    // We check that there's no › rendered inside the email menu row area
    // The email label is "profile_email" key
    const emailLabel = screen.getByText('profile_email');
    const menuRow = emailLabel.closest('button');
    expect(menuRow).toBeTruthy();
    // No › inside this button
    expect(menuRow?.textContent).not.toContain('›');
  });
});
