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
  identifier: string; // username or email
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
  expiresAt: string; // ISO 8601
  playerId: string;
  username: string;
  email: string | null;
  avatarUrl?: string | null;
  nostrPubKey?: string | null;
  role?: string;
}

export interface ConfirmEmailRequest {
  email: string;
  code: string;
}
