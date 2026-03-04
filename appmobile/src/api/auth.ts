import {request} from './client';
import type {
  ConfirmEmailRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
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

export function login(data: LoginRequest): Promise<LoginResponse> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
