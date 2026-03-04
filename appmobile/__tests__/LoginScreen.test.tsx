import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {ApiError} from '../src/api/client';
import {LoginScreen} from '../src/screens/LoginScreen';

jest.mock('../src/api/auth');

import * as authApi from '../src/api/auth';

const mockLogin = authApi.login as jest.MockedFunction<typeof authApi.login>;

const defaultProps = {
  onLoginSuccess: jest.fn(),
  onNavigateToRegister: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('renders email and password inputs', () => {
    const {getByTestId} = render(<LoginScreen {...defaultProps} />);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
  });

  it('renders login button', () => {
    const {getByTestId} = render(<LoginScreen {...defaultProps} />);
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('renders link to register screen', () => {
    const {getByTestId} = render(<LoginScreen {...defaultProps} />);
    expect(getByTestId('register-link')).toBeTruthy();
  });

  it('calls onNavigateToRegister when register link is pressed', () => {
    const onNavigateToRegister = jest.fn();
    const {getByTestId} = render(
      <LoginScreen {...defaultProps} onNavigateToRegister={onNavigateToRegister} />,
    );
    fireEvent.press(getByTestId('register-link'));
    expect(onNavigateToRegister).toHaveBeenCalledTimes(1);
  });

  it('calls login API with form data and triggers onLoginSuccess', async () => {
    const loginData = {
      token: 'jwt',
      playerId: 'id-1',
      username: 'user',
      email: 'user@test.com',
    };
    mockLogin.mockResolvedValueOnce(loginData);
    const onLoginSuccess = jest.fn();

    const {getByTestId} = render(
      <LoginScreen {...defaultProps} onLoginSuccess={onLoginSuccess} />,
    );

    fireEvent.changeText(getByTestId('email-input'), 'user@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'Password1');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'Password1',
      });
      expect(onLoginSuccess).toHaveBeenCalledWith(loginData);
    });
  });

  it('shows error message on invalid credentials (401)', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(401, 'invalid_credentials'));

    const {getByTestId} = render(<LoginScreen {...defaultProps} />);
    fireEvent.changeText(getByTestId('email-input'), 'user@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'WrongPass1');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  it('shows email confirmation message on 403', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(403, 'email_not_confirmed'));

    const {getByTestId, getByText} = render(<LoginScreen {...defaultProps} />);
    fireEvent.changeText(getByTestId('email-input'), 'user@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'Password1');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByText('Confirme seu e-mail antes de entrar.')).toBeTruthy();
    });
  });

  it('shows connection error on unexpected exception', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network Error'));

    const {getByTestId, getByText} = render(<LoginScreen {...defaultProps} />);
    fireEvent.changeText(getByTestId('email-input'), 'user@test.com');
    fireEvent.changeText(getByTestId('password-input'), 'Password1');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByText('Erro de conexão. Tente novamente.')).toBeTruthy();
    });
  });
});
