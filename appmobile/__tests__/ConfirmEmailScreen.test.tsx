import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {ApiError} from '../src/api/client';
import {ConfirmEmailScreen} from '../src/screens/ConfirmEmailScreen';

jest.mock('../src/api/auth');

import * as authApi from '../src/api/auth';

const mockConfirmEmail = authApi.confirmEmail as jest.MockedFunction<
    typeof authApi.confirmEmail
>;

const TEST_EMAIL = 'user@test.com';

const defaultProps = {
    email: TEST_EMAIL,
    onConfirmed: jest.fn(),
    onNavigateToLogin: jest.fn(),
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ConfirmEmailScreen', () => {
    it('renders code input and confirm button', () => {
        const {getByTestId} = render(<ConfirmEmailScreen {...defaultProps} />);
        expect(getByTestId('code-input')).toBeTruthy();
        expect(getByTestId('confirm-button')).toBeTruthy();
    });

    it('displays the email address', () => {
        const {getByTestId} = render(<ConfirmEmailScreen {...defaultProps} />);
        expect(getByTestId('email-display').props.children).toBe(TEST_EMAIL);
    });

    it('calls onNavigateToLogin when login link is pressed', () => {
        const onNavigateToLogin = jest.fn();
        const {getByTestId} = render(
            <ConfirmEmailScreen {...defaultProps} onNavigateToLogin={onNavigateToLogin} />,
        );
        fireEvent.press(getByTestId('login-link'));
        expect(onNavigateToLogin).toHaveBeenCalledTimes(1);
    });

    it('shows error when code is less than 6 digits', async () => {
        const {getByTestId, getByText} = render(
            <ConfirmEmailScreen {...defaultProps} />,
        );
        fireEvent.changeText(getByTestId('code-input'), '123');
        fireEvent.press(getByTestId('confirm-button'));
        await waitFor(() => {
            expect(getByText('O código deve ter 6 dígitos.')).toBeTruthy();
        });
        expect(mockConfirmEmail).not.toHaveBeenCalled();
    });

    it('only accepts numeric input and limits to 6 chars', () => {
        const {getByTestId} = render(<ConfirmEmailScreen {...defaultProps} />);
        const input = getByTestId('code-input');
        fireEvent.changeText(input, 'abc123xyz789');
        expect(input.props.value).toBe('123789');
    });

    it('calls confirmEmail API and triggers onConfirmed', async () => {
        mockConfirmEmail.mockResolvedValueOnce(undefined);
        const onConfirmed = jest.fn();

        const {getByTestId} = render(
            <ConfirmEmailScreen {...defaultProps} onConfirmed={onConfirmed} />,
        );
        fireEvent.changeText(getByTestId('code-input'), '123456');
        fireEvent.press(getByTestId('confirm-button'));

        await waitFor(() => {
            expect(mockConfirmEmail).toHaveBeenCalledWith({
                email: TEST_EMAIL,
                code: '123456',
            });
            expect(onConfirmed).toHaveBeenCalledTimes(1);
        });
    });

    it('shows error on invalid/expired code (400)', async () => {
        mockConfirmEmail.mockRejectedValueOnce(
            new ApiError(400, 'invalid_or_expired_code'),
        );

        const {getByTestId, getByText} = render(
            <ConfirmEmailScreen {...defaultProps} />,
        );
        fireEvent.changeText(getByTestId('code-input'), '999999');
        fireEvent.press(getByTestId('confirm-button'));

        await waitFor(() => {
            expect(
                getByText('Código inválido ou expirado. Tente novamente.'),
            ).toBeTruthy();
        });
    });

    it('shows connection error on network failure', async () => {
        mockConfirmEmail.mockRejectedValueOnce(new Error('Network Error'));

        const {getByTestId, getByText} = render(
            <ConfirmEmailScreen {...defaultProps} />,
        );
        fireEvent.changeText(getByTestId('code-input'), '123456');
        fireEvent.press(getByTestId('confirm-button'));

        await waitFor(() => {
            expect(getByText('Erro de conexão. Tente novamente.')).toBeTruthy();
        });
    });
});
