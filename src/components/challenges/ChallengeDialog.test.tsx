import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockGameContext = vi.hoisted(() => ({
  getEligibleTotems: vi.fn().mockReturnValue([]),
  isTotemAvailable: vi.fn().mockReturnValue(true),
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
}));

vi.mock('../../config/constants', () => ({
  IPFS_GATEWAY_URL: 'https://ipfs.test/',
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="icon-chevron" />,
  X: () => <span data-testid="icon-x" />,
}));

vi.mock('./ChallengeGame', () => ({
  default: ({ challengeId, tokenId }: any) => (
    <div data-testid="challenge-game" data-challenge={challengeId} data-token={tokenId} />
  ),
}));

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
      isStaked: false,
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
      isStaked: false,
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
    expect(screen.getByText(/Stage: 1/)).toBeInTheDocument();
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
    expect(screen.getByText('Out on Expedition')).toBeInTheDocument();
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
