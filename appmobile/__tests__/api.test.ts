import {ApiError, BASE_URL, request} from '../src/api/client';
import {confirmEmail, login, register} from '../src/api/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockOk(body: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function mockError(status: number, errorKey: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({error: errorKey}),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('request()', () => {
  it('sends request with correct URL and headers', async () => {
    mockOk({ok: true});
    await request('/api/test', {method: 'GET'});
    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/api/test`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
    });
  });

  it('throws ApiError on non-ok response', async () => {
    mockError(401, 'invalid_credentials');
    await expect(request('/api/test')).rejects.toThrow(ApiError);
  });

  it('ApiError carries status and message', async () => {
    mockError(409, 'email_taken');
    try {
      await request('/api/test');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(409);
      expect((e as ApiError).message).toBe('email_taken');
    }
  });

  it('returns null for empty response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    });
    const result = await request('/api/test');
    expect(result).toBeNull();
  });
});

describe('register()', () => {
  it('calls POST /api/auth/register with body', async () => {
    mockOk({id: 'uuid', username: 'test', email: 'test@test.com', createdAt: ''});
    const result = await register({
      username: 'test',
      email: 'test@test.com',
      password: 'Password1',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/auth/register`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'test',
          email: 'test@test.com',
          password: 'Password1',
        }),
      }),
    );
    expect(result.username).toBe('test');
  });

  it('throws ApiError with email_taken on 409', async () => {
    mockError(409, 'email_taken');
    await expect(
      register({username: 'test', email: 'test@test.com', password: 'Password1'}),
    ).rejects.toMatchObject({status: 409, message: 'email_taken'});
  });
});

describe('confirmEmail()', () => {
  it('calls POST /api/auth/confirm-email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    });
    await confirmEmail({email: 'test@test.com', code: '123456'});
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/auth/confirm-email`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({email: 'test@test.com', code: '123456'}),
      }),
    );
  });

  it('throws ApiError with invalid_or_expired_code on 400', async () => {
    mockError(400, 'invalid_or_expired_code');
    await expect(
      confirmEmail({email: 'test@test.com', code: '000000'}),
    ).rejects.toMatchObject({status: 400});
  });
});

describe('login()', () => {
  it('calls POST /api/auth/login and returns token', async () => {
    mockOk({
      token: 'jwt-token',
      playerId: 'uuid',
      username: 'test',
      email: 'test@test.com',
    });
    const result = await login({email: 'test@test.com', password: 'Password1'});
    expect(result.token).toBe('jwt-token');
    expect(result.playerId).toBe('uuid');
  });

  it('throws ApiError 401 on wrong credentials', async () => {
    mockError(401, 'invalid_credentials');
    await expect(
      login({email: 'test@test.com', password: 'wrong'}),
    ).rejects.toMatchObject({status: 401});
  });

  it('throws ApiError 403 when email not confirmed', async () => {
    mockError(403, 'email_not_confirmed');
    await expect(
      login({email: 'test@test.com', password: 'Password1'}),
    ).rejects.toMatchObject({status: 403});
  });
});
