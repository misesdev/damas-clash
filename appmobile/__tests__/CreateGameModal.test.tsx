import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {CreateGameModal} from '../src/components/CreateGameModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string, opts?: any) => {
    const map: Record<string, string> = {
      'createGame.title': 'Nova Partida',
      'createGame.friendlyLabel': 'Amistosa',
      'createGame.friendlyDesc': 'Jogue sem apostas',
      'createGame.betLabel': 'Valendo Sats',
      'createGame.betDesc': 'Aposte satoshis',
      'createGame.betAmountLabel': 'Aposta',
      'createGame.betAmountPlaceholder': '1000',
      'createGame.createButton': 'Criar Partida',
      'createGame.errors.invalidAmount': 'Quantia inválida',
      'createGame.errors.insufficientBalance': 'Saldo insuficiente',
    };
    if (key === 'createGame.betAvailable') {return `Disponível: ${opts?.amount}`;}
    return map[key] ?? key;
  }}),
}));

const wallet = {balanceSats: 5000, lockedBalanceSats: 0, availableBalanceSats: 5000};

describe('CreateGameModal', () => {
  it('calls onConfirm with 0 for friendly mode', () => {
    const onConfirm = jest.fn();
    const {getByTestId} = render(
      <CreateGameModal visible={true} wallet={wallet} onConfirm={onConfirm} onClose={jest.fn()} />,
    );
    fireEvent.press(getByTestId('create-game-btn'));
    expect(onConfirm).toHaveBeenCalledWith(0);
  });

  it('switches to bet mode and validates amount', () => {
    const onConfirm = jest.fn();
    const {getByTestId} = render(
      <CreateGameModal visible={true} wallet={wallet} onConfirm={onConfirm} onClose={jest.fn()} />,
    );
    fireEvent.press(getByTestId('mode-bet'));
    fireEvent.changeText(getByTestId('bet-amount-input'), '1000');
    fireEvent.press(getByTestId('create-game-btn'));
    expect(onConfirm).toHaveBeenCalledWith(1000);
  });

  it('does not confirm with 0 in bet mode', () => {
    const onConfirm = jest.fn();
    const {getByTestId} = render(
      <CreateGameModal visible={true} wallet={wallet} onConfirm={onConfirm} onClose={jest.fn()} />,
    );
    fireEvent.press(getByTestId('mode-bet'));
    // no amount entered
    const btn = getByTestId('create-game-btn');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });
});
