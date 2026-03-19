import {request} from './client';
import type {
  ConfirmEmailRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SendLoginCodeResponse,
  VerifyLoginRequest,
} from '../types/auth';

export function register(data: RegisterRequest): Promise<RegisterResponse> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function confirmEmail(data: ConfirmEmailRequest): Promise<LoginResponse> {
  return request('/api/auth/confirm-email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Step 1: sends login code to the player's email
export function login(data: LoginRequest): Promise<SendLoginCodeResponse> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Step 2: verifies login code and returns JWT
export function verifyLogin(data: VerifyLoginRequest): Promise<LoginResponse> {
  return request('/api/auth/verify-login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function resendConfirmation(data: {email: string}): Promise<void> {
  return request('/api/auth/resend-confirmation', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  return request('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({refreshToken}),
  });
}

export function deleteAccount(token: string): Promise<void> {
  return request('/api/auth/account', {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${token}`},
  });
}

export function googleAuth(idToken: string): Promise<LoginResponse> {
  return request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({idToken}),
  });
}

export function nostrChallenge(): Promise<{challenge: string}> {
  return request('/api/auth/nostr/challenge');
}

export interface NostrLoginRequest {
  pubkey: string;
  sig: string;
  challenge: string;
  username?: string;
  avatarUrl?: string;
  lightningAddress?: string;
}

export function nostrLogin(data: NostrLoginRequest): Promise<LoginResponse> {
  return request('/api/auth/nostr/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface NostrEventLoginRequest {
  event: {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
  };
  username?: string;
  avatarUrl?: string;
  lightningAddress?: string;
}

export function nostrEventLogin(data: NostrEventLoginRequest): Promise<LoginResponse> {
  return request('/api/auth/nostr/login-event', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
