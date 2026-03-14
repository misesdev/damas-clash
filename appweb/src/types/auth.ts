export interface RegisterRequest {
  username: string;
  email: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  identifier: string;
}

export interface SendLoginCodeResponse {
  email: string;
}

export interface VerifyLoginRequest {
  email: string;
  code: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  playerId: string;
  username: string;
  email: string | null;
  avatarUrl?: string | null;
  nostrPubKey?: string | null;
  role: string;
  lightningAddress?: string | null;
}

export interface ConfirmEmailRequest {
  email: string;
  code: string;
}
