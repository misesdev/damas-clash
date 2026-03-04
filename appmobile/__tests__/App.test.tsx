import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import App from '../App';
import * as authApi from '../src/api/auth';
import * as authStorage from '../src/storage/auth';

jest.mock('../src/api/auth');
jest.mock('../src/storage/auth');

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaProvider: ({children, ...props}: {children: React.ReactNode}) => (
      <View {...props}>{children}</View>
    ),
    SafeAreaView: ({children}: {children: React.ReactNode}) => (
      <View>{children}</View>
    ),
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

const mockRegister = authApi.register as jest.MockedFunction<typeof authApi.register>;
const mockLogin = authApi.login as jest.MockedFunction<typeof authApi.login>;
const mockVerifyLogin = authApi.verifyLogin as jest.MockedFunction<typeof authApi.verifyLogin>;
const mockLoadSession = authStorage.loadSession as jest.MockedFunction<typeof authStorage.loadSession>;
const mockSaveSession = authStorage.saveSession as jest.MockedFunction<typeof authStorage.saveSession>;
const mockClearSession = authStorage.clearSession as jest.MockedFunction<typeof authStorage.clearSession>;

const fakeSession = {
  token: 'tok',
  playerId: 'pid',
  username: 'testuser',
  email: 'test@test.com',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadSession.mockResolvedValue(null);
  mockSaveSession.mockResolvedValue(undefined);
  mockClearSession.mockResolvedValue(undefined);
});

describe('App navigation', () => {
  it('renders login screen when no saved session', async () => {
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
  });

  it('renders home screen when saved session exists', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('logout-button')).toBeTruthy());
  });

  it('navigates to register screen when register link is pressed', async () => {
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.press(getByTestId('register-link'));
    await waitFor(() => expect(getByTestId('register-button')).toBeTruthy());
  });

  it('navigates back to login from register screen', async () => {
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.press(getByTestId('register-link'));
    await waitFor(() => expect(getByTestId('back-button')).toBeTruthy());
    fireEvent.press(getByTestId('back-button'));
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
  });

  it('shows confirm email screen after successful registration', async () => {
    mockRegister.mockResolvedValueOnce({
      id: 'uuid',
      username: 'testuser',
      email: 'test@test.com',
      createdAt: '',
    });

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.press(getByTestId('register-link'));

    await waitFor(() => expect(getByTestId('register-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('email-input'), 'test@test.com');
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
  });

  it('returns to login from confirm email screen', async () => {
    mockRegister.mockResolvedValueOnce({
      id: 'uuid',
      username: 'testuser',
      email: 'test@test.com',
      createdAt: '',
    });

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.press(getByTestId('register-link'));
    await waitFor(() => expect(getByTestId('register-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('email-input'), 'test@test.com');
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
    fireEvent.press(getByTestId('login-link'));
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
  });

  it('shows verify login screen after entering identifier', async () => {
    mockLogin.mockResolvedValueOnce({email: 'user@test.com'});

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('identifier-input'), 'user@test.com');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
  });

  it('shows home screen and saves session after successful login', async () => {
    mockLogin.mockResolvedValueOnce({email: fakeSession.email});
    mockVerifyLogin.mockResolvedValueOnce(fakeSession);

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('identifier-input'), fakeSession.email);
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('code-input'), '123456');
    fireEvent.press(getByTestId('confirm-button'));

    await waitFor(() => expect(getByTestId('logout-button')).toBeTruthy());
    expect(mockSaveSession).toHaveBeenCalledWith(fakeSession);
  });

  it('returns to login and clears session on logout', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('logout-button')).toBeTruthy());
    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    expect(mockClearSession).toHaveBeenCalled();
  });
});
