import {fireEvent, render} from '@testing-library/react-native';
import React from 'react';
import {NostrAuthScreen} from '../src/screens/NostrAuthScreen';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaView: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

const defaultProps = {
  onLogin: jest.fn(),
  onRegister: jest.fn(),
  onBack: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NostrAuthScreen', () => {
  it('renders sign-in option', () => {
    const {getByTestId} = render(<NostrAuthScreen {...defaultProps} />);
    expect(getByTestId('nostr-signin-button')).toBeTruthy();
  });

  it('renders create account option', () => {
    const {getByTestId} = render(<NostrAuthScreen {...defaultProps} />);
    expect(getByTestId('nostr-create-button')).toBeTruthy();
  });

  it('calls onLogin when sign-in option is pressed', () => {
    const onLogin = jest.fn();
    const {getByTestId} = render(<NostrAuthScreen {...defaultProps} onLogin={onLogin} />);
    fireEvent.press(getByTestId('nostr-signin-button'));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it('calls onRegister when create account option is pressed', () => {
    const onRegister = jest.fn();
    const {getByTestId} = render(<NostrAuthScreen {...defaultProps} onRegister={onRegister} />);
    fireEvent.press(getByTestId('nostr-create-button'));
    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when back button is pressed', () => {
    const onBack = jest.fn();
    const {getByTestId} = render(<NostrAuthScreen {...defaultProps} onBack={onBack} />);
    fireEvent.press(getByTestId('screen-header-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
