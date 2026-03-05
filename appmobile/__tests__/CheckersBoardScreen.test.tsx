/**
 * CheckersBoardScreen — component tests.
 *
 * Strategy:
 *  • Board size comes from useWindowDimensions (no onLayout needed).
 *    In tests, RN returns width=375 → boardSize=319 → cellSize≈40.
 *    Pieces render immediately on mount.
 *  • Wrap each press in act() to flush React state before the next assertion.
 *  • Use waitFor() for assertions that depend on animation callbacks.
 *  • Pure game-logic edge cases live in checkers.test.ts.
 */

import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {CheckersBoardScreen} from '../src/screens/CheckersBoardScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderBoard = (props: Partial<React.ComponentProps<typeof CheckersBoardScreen>> = {}) => {
  const onBack = jest.fn();
  const utils = render(<CheckersBoardScreen onBack={onBack} {...props} />);
  return {...utils, onBack};
};

/** Press a cell, flushing state updates via act(). */
const pressCell = async (
  getByTestId: ReturnType<typeof render>['getByTestId'],
  cellId: string,
) => {
  await act(async () => {
    fireEvent.press(getByTestId(cellId));
  });
};

// ── Initial render ────────────────────────────────────────────────────────────

describe('initial render', () => {
  it('renders the board', () => {
    const {getByTestId} = renderBoard();
    expect(getByTestId('checkers-board')).toBeTruthy();
  });

  it('renders 12 dark and 12 light pieces', () => {
    const {queryAllByTestId} = renderBoard();
    expect(queryAllByTestId('piece-dark')).toHaveLength(12);
    expect(queryAllByTestId('piece-light')).toHaveLength(12);
  });

  it('shows "Turno das Claras" at game start', () => {
    const {getByText} = renderBoard();
    expect(getByText('Turno das Claras')).toBeTruthy();
  });

  it('renders the back button', () => {
    const {getByTestId} = renderBoard();
    expect(getByTestId('back-home-button')).toBeTruthy();
  });

  it('calls onBack when back button is pressed', () => {
    const {getByTestId, onBack} = renderBoard();
    fireEvent.press(getByTestId('back-home-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ── Piece selection ───────────────────────────────────────────────────────────

describe('piece selection', () => {
  it('does not allow selecting a dark piece on light\'s turn', async () => {
    const {getByTestId, queryAllByTestId} = renderBoard();
    // Dark piece at (0,1) — wrong colour for light's turn → no selection
    await pressCell(getByTestId, 'cell-0-1');
    // Piece count unchanged
    expect(queryAllByTestId('piece-dark')).toHaveLength(12);
  });

  it('allows pressing a light piece without crashing', () => {
    const {getByTestId} = renderBoard();
    expect(() => fireEvent.press(getByTestId('cell-5-0'))).not.toThrow();
  });
});

// ── Move execution ────────────────────────────────────────────────────────────

describe('move execution', () => {
  it('keeps 12 light pieces after a move', async () => {
    const {getByTestId, queryAllByTestId} = renderBoard();

    // Light (5,0) → (4,1)
    await pressCell(getByTestId, 'cell-5-0'); // select
    await pressCell(getByTestId, 'cell-4-1'); // move

    await waitFor(() => {
      expect(queryAllByTestId('piece-light')).toHaveLength(12);
    });
  });

  it('switches turn to dark after light moves', async () => {
    const {getByTestId, getByText} = renderBoard();

    await pressCell(getByTestId, 'cell-5-0');
    await pressCell(getByTestId, 'cell-4-1');

    await waitFor(() => {
      expect(getByText('Turno das Escuras')).toBeTruthy();
    });
  });

  it('deselects piece when tapping the same piece again', async () => {
    const {getByTestId} = renderBoard();
    await pressCell(getByTestId, 'cell-5-0');
    await pressCell(getByTestId, 'cell-5-0'); // deselect
    expect(getByTestId('checkers-board')).toBeTruthy();
  });

  it('deselects and clears selection when tapping an empty non-target cell', async () => {
    const {getByTestId} = renderBoard();
    await pressCell(getByTestId, 'cell-5-0'); // select
    await pressCell(getByTestId, 'cell-3-3'); // not a valid target → deselect
    expect(getByTestId('checkers-board')).toBeTruthy();
  });

  it('calls onMove callback when a move is made', async () => {
    const onMove = jest.fn();
    const {getByTestId} = renderBoard({onMove});

    await pressCell(getByTestId, 'cell-5-0');
    await pressCell(getByTestId, 'cell-4-1');

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledWith(5, 0, 4, 1);
    });
  });
});

// ── Capture ───────────────────────────────────────────────────────────────────

describe('capture', () => {
  it('reduces piece count by 1 after a capture', async () => {
    // Sequence:
    //   Step 1: light (5,0) → (4,1)
    //   Step 2: dark  (2,3) → (3,2)  [now light at (4,1) can capture dark at (3,2)]
    //   Step 3: light (4,1) captures dark at (3,2) → lands (2,3)
    const {getByTestId, queryAllByTestId, getByText} = renderBoard();

    // Step 1 — light moves; wait for turn to switch to dark
    await pressCell(getByTestId, 'cell-5-0');
    await pressCell(getByTestId, 'cell-4-1');
    await waitFor(() => expect(getByText('Turno das Escuras')).toBeTruthy());

    // Step 2 — dark moves; wait for animation callback to fire (turn flips to light).
    // After the animation, mustCapture=true for light so subtitle = "Captura obrigatória".
    await pressCell(getByTestId, 'cell-2-3');
    await pressCell(getByTestId, 'cell-3-2');
    await waitFor(() => expect(getByText('Captura obrigatória')).toBeTruthy());

    // Step 3 — light captures dark; piece count drops to 11
    await pressCell(getByTestId, 'cell-4-1');
    await pressCell(getByTestId, 'cell-2-3');

    await waitFor(() => {
      expect(queryAllByTestId('piece-dark')).toHaveLength(11);
    }, {timeout: 3000});
  });
});

// ── Win condition UI ──────────────────────────────────────────────────────────

describe('win condition', () => {
  it('does NOT show "Nova partida" button at game start', () => {
    const {queryByTestId} = renderBoard();
    expect(queryByTestId('new-game-button')).toBeNull();
  });
});

// ── New game reset ─────────────────────────────────────────────────────────────

describe('new game', () => {
  it('starts with 12+12 pieces', () => {
    const {queryAllByTestId} = renderBoard();
    expect(queryAllByTestId('piece-dark')).toHaveLength(12);
    expect(queryAllByTestId('piece-light')).toHaveLength(12);
  });
});
