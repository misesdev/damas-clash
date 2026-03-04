import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import App from '../App';
import * as authApi from '../src/api/auth';

jest.mock('../src/api/auth');

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaProvider: ({children}: {children: React.ReactNode}) => (
      <View>{children}</View>
    ),
    SafeAreaView: ({children}: {children: React.ReactNode}) => (
      <View>{children}</View>
    ),
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

const mockRegister = authApi.register as jest.MockedFunction<
  typeof authApi.register
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('App navigation', () => {
  it('renders login screen by default', () => {
    const {getByTestId} = render(<App />);
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('navigates to register screen when register link is pressed', async () => {
    const {getByTestId} = render(<App />);
    fireEvent.press(getByTestId('register-link'));
    await waitFor(() => {
      expect(getByTestId('register-button')).toBeTruthy();
    });
  });

  it('navigates back to login from register screen', async () => {
    const {getByTestId} = render(<App />);
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
    fireEvent.press(getByTestId('register-link'));

    await waitFor(() => expect(getByTestId('register-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('email-input'), 'test@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'Password1');
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => {
      expect(getByTestId('confirm-button')).toBeTruthy();
    });
  });

  it('returns to login from confirm email screen', async () => {
    mockRegister.mockResolvedValueOnce({
      id: 'uuid',
      username: 'testuser',
      email: 'test@test.com',
      createdAt: '',
    });

    const {getByTestId} = render(<App />);
    fireEvent.press(getByTestId('register-link'));
    await waitFor(() => expect(getByTestId('register-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('email-input'), 'test@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'Password1');
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
    fireEvent.press(getByTestId('login-link'));
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
  });
});
