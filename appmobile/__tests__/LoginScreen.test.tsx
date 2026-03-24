import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {ApiError} from '../src/api/client';
import {LoginScreen} from '../src/screens/LoginScreen';

jest.mock('../src/api/auth');

import * as authApi from '../src/api/auth';

const mockLogin = authApi.login as jest.MockedFunction<typeof authApi.login>;

const defaultProps = {
  onCodeSent: jest.fn(),
  onNavigateToRegister: jest.fn(),
  onNostrLogin: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('renders identifier input', () => {
    const {getByTestId} = render(<LoginScreen {...defaultProps} />);
    expect(getByTestId('identifier-input')).toBeTruthy();
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

  it('renders nostr login button', () => {
    const {getByTestId} = render(<LoginScreen {...defaultProps} />);
    expect(getByTestId('nostr-login-button')).toBeTruthy();
  });

  it('calls onNostrLogin when nostr button is pressed', () => {
    const onNostrLogin = jest.fn();
    const {getByTestId} = render(
      <LoginScreen {...defaultProps} onNostrLogin={onNostrLogin} />,
    );
    fireEvent.press(getByTestId('nostr-login-button'));
    expect(onNostrLogin).toHaveBeenCalledTimes(1);
  });

  it('calls login API with identifier and triggers onCodeSent', async () => {
    mockLogin.mockResolvedValueOnce({email: 'user@test.com'});
    const onCodeSent = jest.fn();

    const {getByTestId} = render(
      <LoginScreen {...defaultProps} onCodeSent={onCodeSent} />,
    );

    fireEvent.changeText(getByTestId('identifier-input'), 'user@test.com');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({identifier: 'user@test.com'});
      expect(onCodeSent).toHaveBeenCalledWith('user@test.com');
    });
  });

  it('shows error message on user not found (404)', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(404, 'user_not_found'));

    const {getByTestId} = render(<LoginScreen {...defaultProps} />);
    fireEvent.changeText(getByTestId('identifier-input'), 'nobody');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  it('shows email confirmation message on 403', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(403, 'email_not_confirmed'));

    const {getByTestId, getByText} = render(<LoginScreen {...defaultProps} />);
    fireEvent.changeText(getByTestId('identifier-input'), 'user@test.com');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByText('Confirme seu e-mail antes de entrar.')).toBeTruthy();
    });
  });

  it('shows connection error on unexpected exception', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network Error'));

    const {getByTestId, getByText} = render(<LoginScreen {...defaultProps} />);
    fireEvent.changeText(getByTestId('identifier-input'), 'user@test.com');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByText('Erro de conexão. Tente novamente.')).toBeTruthy();
    });
  });
});
