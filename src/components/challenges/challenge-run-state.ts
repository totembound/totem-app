import { createContext } from 'react';
import { GameState } from '../../types/types';

/**
 * Mini-game run-state reporter.
 *
 * All 12 mini-games render the shared ChallengeActionBar with their internal
 * `gameState` ('ready' | 'playing' | 'success' | 'failed'). ChallengeActionBar
 * reports state changes through this context so ChallengeDialog can lock the
 * difficulty selector while a run is in progress — without threading a callback
 * prop through every mini-game.
 *
 * Null when no listener is mounted (e.g. games rendered outside the dialog).
 */
export const ChallengeRunStateContext = createContext<((state: GameState) => void) | null>(null);
