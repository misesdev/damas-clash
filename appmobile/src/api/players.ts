import {ApiError, BASE_URL, request} from './client';

const auth = (token: string) => ({Authorization: `Bearer ${token}`});

export interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  lightningAddress: string | null;
  createdAt: string;
}

export const getPlayer = (token: string, playerId: string) =>
  request<PlayerProfile>(`/api/players/${playerId}`, {
    headers: auth(token),
  });

export const updateLightningAddress = (token: string, playerId: string, address: string | null) =>
  request<PlayerProfile>(`/api/players/${playerId}/lightning-address`, {
    method: 'PUT',
    headers: auth(token),
    body: JSON.stringify({address}),
  });

export const validateLightningAddress = (address: string) =>
  request<{callback: string; minSendable: number; maxSendable: number}>(
    `/api/players/validate-lightning-address?address=${encodeURIComponent(address)}`,
  );

export const updateUsername = (token: string, playerId: string, username: string) =>
  request<{id: string; username: string; email: string}>(`/api/players/${playerId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: JSON.stringify({username}),
  });

export const requestEmailChange = (token: string, newEmail: string) =>
  request<void>('/api/auth/request-email-change', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({newEmail}),
  });

export const confirmEmailChange = (token: string, newEmail: string, code: string) =>
  request<{email: string}>('/api/auth/confirm-email-change', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({newEmail, code}),
  });

export async function updateAvatar(
  token: string,
  playerId: string,
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', {uri, name: fileName, type: mimeType} as any);

  const response = await fetch(`${BASE_URL}/api/players/${playerId}/avatar`, {
    method: 'POST',
    headers: auth(token),
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error ?? 'upload_failed');
  }

  const data = await response.json();
  return data.avatarUrl as string;
}
