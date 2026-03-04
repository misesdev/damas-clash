export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  playerId: string;
  username: string;
  email: string;
}

export interface ConfirmEmailRequest {
  email: string;
  code: string;
}
