import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockGameContext = vi.hoisted(() => ({
  getEligibleTotems: vi.fn().mockReturnValue([]),
  isTotemAvailable: vi.fn().mockReturnValue(true),
  challengeState: { challenges: {}, userStatus: {}, loading: false, error: null },
}));

const mockUserContext = vi.hoisted(() => ({
  tutorialWizardVisible: false,
}));

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../../contexts/GameContext', () => ({
  useGame: () => mockGameContext,
}));

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUserContext,
}));

vi.mock('../../utils/totems', () => ({
  getGameDifficulty: (totem: any, reqStage: number) => {
    if (!totem) return 0;
    return totem.attributes.stage + 1 <= reqStage ? 1 : 2;
  },
  getTotemStage: (totem: any) => (totem?.attributes?.stage ?? 0) + 1,
  getRarityBorderColor: () => ({ border: 'border-gray-200', ring: 'ring-gray-400' }),
}));

vi.mock('../../config/constants', () => ({
  IPFS_GATEWAY_URL: 'https://ipfs.test/',
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="icon-chevron" />,
  X: () => <span data-testid="icon-x" />,
}));

vi.mock('./ChallengeGame', async () => {
  const { useContext } = await import('react');
  const { ChallengeRunStateContext } = await import('./challenge-run-state');
  // Mirror the real wiring: ChallengeActionBar (inside the mini-games)
  // reports run-state changes through ChallengeRunStateContext.
  const MockChallengeGame = ({ challengeId, tokenId, onCompleted }: any) => {
    const report = useContext(ChallengeRunStateContext);
    return (
      <div data-testid="challenge-game" data-challenge={challengeId} data-token={tokenId}>
        <button data-testid="mock-run-start" onClick={() => report?.('playing')}>
          start run
        </button>
        <button data-testid="mock-run-success" onClick={() => report?.('success')}>
          run succeeded
        </button>
        <button data-testid="mock-run-failed" onClick={() => report?.('failed')}>
          run failed
        </button>
        <button data-testid="mock-run-reset" onClick={() => report?.('ready')}>
          back to ready
        </button>
        <button data-testid="mock-complete" onClick={() => onCompleted?.()}>
          complete
        </button>
      </div>
    );
  };
  return { default: MockChallengeGame };
});

// ============================================================================
// TEST DATA
// ============================================================================

const mockTotems = [
  {
    id: 'ttm_001',
    name: 'Wolf',
    displayName: 'Gray Pup',
    image: 'https://ipfs.test/wolf.png',
    affinity: 'Strength',
    domain: 'Earth',
    description: '',
    attributes: {
      species: 2,
      color: 0,
      rarity: 0,
      happiness: 80,
      experience: 2000,
      stage: 2,
      strength: 15,
      agility: 8,
      wisdom: 5,
      nickname: null,
      prestigeLevel: 0,
    },
    trackings: {},
  },
  {
    id: 'ttm_002',
    name: 'Owl',
    displayName: 'Snowy Owlet',
    image: 'https://ipfs.test/owl.png',
    affinity: 'Wisdom',
    domain: 'Air',
    description: '',
    attributes: {
      species: 11,
      color: 2,
      rarity: 1,
      happiness: 70,
      experience: 1500,
      stage: 1,
      strength: 5,
      agility: 6,
      wisdom: 14,
      nickname: null,
      prestigeLevel: 0,
    },
    trackings: {},
  },
];

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import ChallengeDialog from './ChallengeDialog';

describe('ChallengeDialog', () => {
  const defaultProps = {
    isOpen: true,
    challengeId: 'ch_boulder_push',
    title: 'Boulder Push',
    onClose: vi.fn(),
    challengeType: 'strength',
    requirements: {
      stage: 1,
      strength: 10,
      agility: 0,
      wisdom: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameContext.getEligibleTotems.mockReturnValue(mockTotems);
    mockGameContext.isTotemAvailable.mockReturnValue(true);
  });

  // =========================================================================
  // VISIBILITY
  // =========================================================================

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <ChallengeDialog {...defaultProps} isOpen={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders when isOpen is true', () => {
    render(<ChallengeDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Select a Totem' })).toBeInTheDocument();
  });

  // =========================================================================
  // TOTEM SELECTION VIEW
  // =========================================================================

  it('shows eligible totems in the selection grid', () => {
    render(<ChallengeDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /gray pup/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /snowy owlet/i })).toBeInTheDocument();
  });

  it('shows strength stat for strength challenge type', () => {
    render(<ChallengeDialog {...defaultProps} />);
    expect(screen.getByText('Str: 15')).toBeInTheDocument();
  });

  it('shows agility stat for agility challenge type', () => {
    render(<ChallengeDialog {...defaultProps} challengeType="agility" />);
    expect(screen.getByText('Agi: 8')).toBeInTheDocument();
  });

  it('shows wisdom stat for wisdom challenge type', () => {
    render(<ChallengeDialog {...defaultProps} challengeType="wisdom" />);
    expect(screen.getByText('Wis: 14')).toBeInTheDocument();
  });

  it('shows totem stage', () => {
    render(<ChallengeDialog {...defaultProps} />);
    // getTotemStage returns stage+1, so stage 2 → "Stage: 3", stage 1 → "Stage: 2"
    expect(screen.getByText('Stage: 3')).toBeInTheDocument();
    expect(screen.getByText('Stage: 2')).toBeInTheDocument();
  });

  // =========================================================================
  // NO ELIGIBLE TOTEMS
  // =========================================================================

  it('shows requirements message when no eligible totems', () => {
    mockGameContext.getEligibleTotems.mockReturnValue([]);
    render(<ChallengeDialog {...defaultProps} />);
    expect(screen.getByText(/None of your totems meet the requirements/)).toBeInTheDocument();
    expect(screen.getByText(/Strength: 10/)).toBeInTheDocument();
    expect(screen.getByText(/Stage: 2/)).toBeInTheDocument();
  });

  it('shows agility requirement for agility challenges', () => {
    mockGameContext.getEligibleTotems.mockReturnValue([]);
    render(<ChallengeDialog {...defaultProps} challengeType="agility" requirements={{ stage: 2, strength: 0, agility: 8, wisdom: 0 }} />);
    expect(screen.getByText(/Agility: 8/)).toBeInTheDocument();
  });

  it('shows wisdom requirement for wisdom challenges', () => {
    mockGameContext.getEligibleTotems.mockReturnValue([]);
    render(<ChallengeDialog {...defaultProps} challengeType="wisdom" requirements={{ stage: 1, strength: 0, agility: 0, wisdom: 12 }} />);
    expect(screen.getByText(/Wisdom: 12/)).toBeInTheDocument();
  });

  // =========================================================================
  // TOTEM ON EXPEDITION (unavailable)
  // =========================================================================

  it('shows unavailable overlay for totems on expedition', () => {
    mockGameContext.isTotemAvailable.mockImplementation((id: string) => id !== 'ttm_001');
    render(<ChallengeDialog {...defaultProps} />);
    expect(screen.getByText('On Expedition')).toBeInTheDocument();
  });

  it('does not select unavailable totem on click', async () => {
    mockGameContext.isTotemAvailable.mockImplementation((id: string) => id !== 'ttm_001');
    render(<ChallengeDialog {...defaultProps} />);

    // Click the unavailable totem
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));
    // Should still be on selection view (heading is "Select a Totem")
    expect(screen.getByRole('heading', { name: 'Select a Totem' })).toBeInTheDocument();
  });

  // =========================================================================
  // TOTEM SELECTION → GAME VIEW
  // =========================================================================

  it('switches to game view when available totem is selected', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));

    // Header changes to challenge title
    expect(screen.getByRole('heading', { name: 'Boulder Push' })).toBeInTheDocument();
    // Challenge game is rendered with correct props
    const game = screen.getByTestId('challenge-game');
    expect(game).toBeInTheDocument();
    expect(game).toHaveAttribute('data-challenge', 'ch_boulder_push');
    expect(game).toHaveAttribute('data-token', 'ttm_001');
  });

  it('shows difficulty in game view', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));

    expect(screen.getByText(/Difficulty/)).toBeInTheDocument();
  });

  it('shows selected totem info in game view', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));

    expect(screen.getByText('Gray Pup')).toBeInTheDocument();
    expect(screen.getByText('Stage 3')).toBeInTheDocument();
  });

  it('back button returns to totem selection', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    // Select a totem to enter game view
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));
    expect(screen.getByRole('heading', { name: 'Boulder Push' })).toBeInTheDocument();

    // Click back button (ChevronLeft)
    await userEvent.click(screen.getByTestId('icon-chevron').closest('button')!);
    expect(screen.getByRole('heading', { name: 'Select a Totem' })).toBeInTheDocument();
  });

  it('hides back button after challenge is completed', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));
    expect(screen.getByTestId('icon-chevron')).toBeInTheDocument();

    // Simulate ChallengeGame firing onCompleted after success state
    await userEvent.click(screen.getByRole('button', { name: /complete/i }));

    expect(screen.queryByTestId('icon-chevron')).not.toBeInTheDocument();
  });

  // =========================================================================
  // DIFFICULTY SELECTOR LOCK DURING A RUN
  // =========================================================================

  it('locks the difficulty selector while a run is in progress and re-enables when idle', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    // Gray Pup: stage 2, req stage 1 → mocked getGameDifficulty = 2 (auto)
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));

    // Before the run starts: levels 1..auto selectable
    const level1 = screen.getByRole('radio', { name: /Difficulty 1/ });
    expect(level1).toBeEnabled();

    // Run starts → selector locks with the "locked during a run" hint
    await userEvent.click(screen.getByRole('button', { name: /start run/i }));
    expect(screen.getByRole('radio', { name: /Difficulty 1.*locked during a run/ })).toBeDisabled();
    expect(screen.getByRole('radiogroup', { name: /locked during a run/i })).toBeInTheDocument();

    // Run finished with a pending (unsubmitted) score → stays locked
    await userEvent.click(screen.getByRole('button', { name: /run succeeded/i }));
    expect(screen.getByRole('radio', { name: /Difficulty 1.*locked during a run/ })).toBeDisabled();

    // Game returns to its pre-start state (Try Again) → selector re-enables
    await userEvent.click(screen.getByRole('button', { name: /back to ready/i }));
    expect(screen.getByRole('radio', { name: 'Difficulty 1' })).toBeEnabled();
  });

  it('re-enables the selector after a failed run (accessibility: fail → lower difficulty)', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));

    await userEvent.click(screen.getByRole('button', { name: /start run/i }));
    expect(screen.getByRole('radio', { name: /Difficulty 1.*locked during a run/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /run failed/i }));
    expect(screen.getByRole('radio', { name: 'Difficulty 1' })).toBeEnabled();
  });

  it('does not remount the game when the selector is locked mid-run', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('heading', { name: /gray pup/i }));

    // Wait for the selector to settle on the stage-derived auto difficulty (2)
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Difficulty 2/ })).toHaveAttribute('aria-checked', 'true');
    });

    await userEvent.click(screen.getByRole('button', { name: /start run/i }));
    // Clicking a locked (disabled) difficulty level must not change the
    // selection — the game's key stays stable, so the run isn't discarded.
    const level1 = screen.getByRole('radio', { name: /Difficulty 1/ });
    await userEvent.click(level1);
    expect(level1).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /Difficulty 2/ })).toHaveAttribute('aria-checked', 'true');
  });

  // =========================================================================
  // CLOSE
  // =========================================================================

  it('calls onClose when X button clicked', async () => {
    render(<ChallengeDialog {...defaultProps} />);
    const closeBtn = screen.getByTestId('icon-x').closest('button')!;
    await userEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
