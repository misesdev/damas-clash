import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {ApiError} from '../src/api/client';
import {RegisterScreen} from '../src/screens/RegisterScreen';

jest.mock('../src/api/auth');

import * as authApi from '../src/api/auth';

const mockRegister = authApi.register as jest.MockedFunction<
  typeof authApi.register
>;

const defaultProps = {
  onRegistered: jest.fn(),
  onNavigateToLogin: jest.fn(),
};

const VALID = {
  username: 'testuser',
  email: 'test@test.com',
};

function fillForm(
  getByTestId: ReturnType<typeof render>['getByTestId'],
  data: typeof VALID = VALID,
) {
  fireEvent.changeText(getByTestId('username-input'), data.username);
  fireEvent.changeText(getByTestId('email-input'), data.email);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RegisterScreen', () => {
  it('renders all form fields', () => {
    const {getByTestId} = render(<RegisterScreen {...defaultProps} />);
    expect(getByTestId('username-input')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('register-button')).toBeTruthy();
  });

  it('calls onNavigateToLogin when back button is pressed', () => {
    const onNavigateToLogin = jest.fn();
    const {getByTestId} = render(
      <RegisterScreen {...defaultProps} onNavigateToLogin={onNavigateToLogin} />,
    );
    fireEvent.press(getByTestId('back-button'));
    expect(onNavigateToLogin).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigateToLogin when login link is pressed', () => {
    const onNavigateToLogin = jest.fn();
    const {getByTestId} = render(
      <RegisterScreen {...defaultProps} onNavigateToLogin={onNavigateToLogin} />,
    );
    fireEvent.press(getByTestId('login-link'));
    expect(onNavigateToLogin).toHaveBeenCalledTimes(1);
  });

  it('shows username error when too short', async () => {
    const {getByTestId, getByText} = render(<RegisterScreen {...defaultProps} />);
    fillForm(getByTestId, {...VALID, username: 'ab'});
    fireEvent.press(getByTestId('register-button'));
    await waitFor(() => {
      expect(getByText('Mínimo 3 caracteres.')).toBeTruthy();
    });
  });

  it('shows email error when invalid', async () => {
    const {getByTestId, getByText} = render(<RegisterScreen {...defaultProps} />);
    fillForm(getByTestId, {...VALID, email: 'notanemail'});
    fireEvent.press(getByTestId('register-button'));
    await waitFor(() => {
      expect(getByText('E-mail inválido.')).toBeTruthy();
    });
  });

  it('does not call API when validation fails', async () => {
    const {getByTestId} = render(<RegisterScreen {...defaultProps} />);
    fillForm(getByTestId, {...VALID, username: 'ab'});
    fireEvent.press(getByTestId('register-button'));
    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it('calls register API with correct data and triggers onRegistered', async () => {
    mockRegister.mockResolvedValueOnce({
      id: 'uuid',
      username: VALID.username,
      email: VALID.email,
      createdAt: '',
    });
    const onRegistered = jest.fn();

    const {getByTestId} = render(
      <RegisterScreen {...defaultProps} onRegistered={onRegistered} />,
    );
    fillForm(getByTestId);
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(VALID);
      expect(onRegistered).toHaveBeenCalledWith(VALID.email);
    });
  });

  it('shows email_taken error from API', async () => {
    mockRegister.mockRejectedValueOnce(new ApiError(409, 'email_taken'));

    const {getByTestId, getByText} = render(<RegisterScreen {...defaultProps} />);
    fillForm(getByTestId);
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => {
      expect(getByText('E-mail já cadastrado.')).toBeTruthy();
    });
  });

  it('shows username_taken error from API', async () => {
    mockRegister.mockRejectedValueOnce(new ApiError(409, 'username_taken'));

    const {getByTestId, getByText} = render(<RegisterScreen {...defaultProps} />);
    fillForm(getByTestId);
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => {
      expect(getByText('Nome de usuário já existe.')).toBeTruthy();
    });
  });

  it('shows general error on network failure', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Network Error'));

    const {getByTestId, getByText} = render(<RegisterScreen {...defaultProps} />);
    fillForm(getByTestId);
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => {
      expect(getByText('Erro de conexão. Tente novamente.')).toBeTruthy();
    });
  });
});
