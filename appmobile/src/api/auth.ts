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

export function confirmEmail(data: ConfirmEmailRequest): Promise<void> {
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
