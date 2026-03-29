import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
// ActionType removed - unused import

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockUserContext = vi.hoisted(() => ({
  essenceBalance: '5000',
  setEssenceBalance: vi.fn(),
}));

const mockGameApi = vi.hoisted(() => ({
  feed: vi.fn().mockResolvedValue({ success: true }),
  train: vi.fn().mockResolvedValue({ success: true }),
  treat: vi.fn().mockResolvedValue({ success: true }),
  evolve: vi.fn().mockResolvedValue({ success: true }),
}));

const mockGameContext = vi.hoisted(() => ({
  isTotemAvailable: vi.fn().mockReturnValue(true),
  expeditionState: { userExpeditions: [] as any[] },
  fetchTotemCooldowns: vi.fn().mockResolvedValue({
    feed: { onCooldown: false, readyAt: null, remainingMs: 0 },
    train: { onCooldown: false, readyAt: null, remainingMs: 0 },
    treat: { onCooldown: false, readyAt: null, remainingMs: 0 },
  }),
  setTotemCooldowns: vi.fn(),
  actionConfigs: {
    1: { cost: 10, cooldown: 0, maxDaily: 3, minHappiness: 0, happinessChange: 10, experienceGain: 0, useTimeWindows: true, increasesHappiness: true, enabled: true },
    2: { cost: 20, cooldown: 0, maxDaily: 0, minHappiness: 20, happinessChange: -10, experienceGain: 50, useTimeWindows: false, increasesHappiness: false, enabled: true },
    3: { cost: 20, cooldown: 14400, maxDaily: 0, minHappiness: 0, happinessChange: 10, experienceGain: 0, useTimeWindows: false, increasesHappiness: true, enabled: true },
    4: { cost: 0, cooldown: 0, maxDaily: 0, minHappiness: 30, happinessChange: 0, experienceGain: 0, useTimeWindows: false, increasesHappiness: false, enabled: true },
    0: { cost: 0, cooldown: 0, maxDaily: 0, minHappiness: 0, happinessChange: 0, experienceGain: 0, useTimeWindows: false, increasesHappiness: false, enabled: false },
  },
}));

const mockAchievementsContext = vi.hoisted(() => ({
  incrementAchievementProgress: vi.fn(),
}));

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../contexts/UserContext', () => ({
  useUser: () => mockUserContext,
}));

vi.mock('../hooks/useTotemGameApi', () => ({
  useTotemGameApi: () => mockGameApi,
}));

vi.mock('../contexts/GameContext', () => ({
  useGame: () => mockGameContext,
}));

vi.mock('../contexts/AchievementsContext', () => ({
  useAchievements: () => mockAchievementsContext,
}));

vi.mock('../config/constants', () => ({
  STAGE_THRESHOLDS: [0, 500, 1500, 3500, 7500],
}));

vi.mock('../utils/species', () => ({
  getTotemImageUrl: () => '/test-image.png',
  getStageName: () => 'Gray Pup',
  getStageDescription: () => 'A young wolf.',
  isSpeciesLoaded: vi.fn().mockReturnValue(true),
}));

vi.mock('./CelebrationModal', () => ({
  default: ({ type: _type, onClose }: any) => (
    <div data-testid="celebration-modal">
      <button onClick={onClose}>Close Celebration</button>
    </div>
  ),
}));

vi.mock('./TotemDetailHeader', () => ({
  default: ({ name, displayName: _displayName, onClose, onPrev, onNext }: any) => (
    <div data-testid="totem-header">
      <h1>{name}</h1>
      <button onClick={onClose}>Close</button>
      {onPrev && <button onClick={onPrev} aria-label="Previous Totem">Previous Totem</button>}
      {onNext && <button onClick={onNext} aria-label="Next Totem">Next Totem</button>}
    </div>
  ),
}));

vi.mock('./TotemImageSection', () => ({
  default: ({ isOnExpedition }: any) => (
    <div data-testid="totem-image">
      {isOnExpedition && <span>On Expedition</span>}
    </div>
  ),
}));

// Render no visible text so getByTestId is the best query
vi.mock('./TotemStatsPanel', () => ({
  default: () => <div data-testid="stats-panel" />,
}));

vi.mock('./TotemDetailsPanel', () => ({
  default: () => <div data-testid="details-panel" />,
}));

vi.mock('./TotemActionBar', () => ({
  default: ({ onFeed, onTrain, onTreat, onEvolve, isLoading, canEvolve, essenceBalance, isTotemOnExpedition }: any) => (
    <div data-testid="action-bar" data-essence={essenceBalance}>
      <button onClick={onFeed} disabled={isLoading !== null || isTotemOnExpedition}>Feed (10)</button>
      <button onClick={onTrain} disabled={isLoading !== null || isTotemOnExpedition}>Train (20)</button>
      <button onClick={onTreat} disabled={isLoading !== null || isTotemOnExpedition}>Treat (20)</button>
      <button onClick={onEvolve} disabled={isLoading !== null || !canEvolve || isTotemOnExpedition}>Evolve</button>
    </div>
  ),
}));

vi.mock('./TotemNavigation', () => ({
  default: ({ onPrev, onNext }: any) => (
    <div data-testid="totem-nav">
      <button onClick={onPrev}>Prev</button>
      <button onClick={onNext}>Next</button>
    </div>
  ),
}));

vi.mock('./effects/ExperienceEffect', () => ({
  default: () => <div data-testid="xp-effect" />,
}));

// ============================================================================
// TEST DATA
// ============================================================================

const makeTestTotem = (overrides: any = {}) => ({
  id: 'ttm_001',
  name: 'Wolf',
  displayName: 'Gray Pup',
  image: '/wolf.png',
  affinity: 'Strength',
  domain: 'Earth',
  description: 'A mighty wolf.',
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
    nickname: 'Fang',
    prestigeLevel: 0,
    ...overrides.attributes,
  },
  trackings: overrides.trackings || {},
  ...overrides,
});

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import TotemDetailView from './TotemDetailView';

describe('TotemDetailView', () => {
  const defaultProps = {
    totem: makeTestTotem(),
    onClose: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    totalTotems: 3,
    currentIndex: 0,
    onUpdateTotemAttributes: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameApi.feed.mockResolvedValue({ success: true, newEssenceBalance: 4990, xpGained: 0, statChanges: { happiness: 90 } });
    mockGameApi.train.mockResolvedValue({ success: true, newEssenceBalance: 4980, xpGained: 50, newExperience: 2050, statChanges: { happiness: 70 } });
    mockGameApi.treat.mockResolvedValue({ success: true, newEssenceBalance: 4980, statChanges: { happiness: 90 } });
    mockGameApi.evolve.mockResolvedValue({ success: true, newStage: 3, statBoosts: { strength: 2, agility: 1 } });
    mockGameContext.isTotemAvailable.mockReturnValue(true);
    mockGameContext.expeditionState.userExpeditions = [];
    mockGameContext.fetchTotemCooldowns.mockResolvedValue({
      feed: { onCooldown: false, readyAt: null, remainingMs: 0 },
      train: { onCooldown: false, readyAt: null, remainingMs: 0 },
      treat: { onCooldown: false, readyAt: null, remainingMs: 0 },
    });
  });

  // =========================================================================
  // RENDER
  // =========================================================================

  it('renders totem header with name', () => {
    render(<TotemDetailView {...defaultProps} />);
    expect(screen.getByTestId('totem-header')).toBeInTheDocument();
  });

  it('renders action bar', () => {
    render(<TotemDetailView {...defaultProps} />);
    expect(screen.getByTestId('action-bar')).toBeInTheDocument();
  });

  it('shows essence balance from auth context', () => {
    render(<TotemDetailView {...defaultProps} />);
    expect(screen.getByTestId('action-bar')).toHaveAttribute('data-essence', '5000');
  });

  it('renders stats tab by default', () => {
    render(<TotemDetailView {...defaultProps} />);
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('switches to details tab', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByTestId('details-panel')).toBeInTheDocument();
  });

  it('shows nickname in description if set', () => {
    render(<TotemDetailView {...defaultProps} />);
    expect(screen.getByText(/Known as "Fang"/)).toBeInTheDocument();
  });

  // =========================================================================
  // FEED ACTION
  // =========================================================================

  it('calls feed API and updates attributes on Feed', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Feed/ }));

    await waitFor(() => {
      expect(mockGameApi.feed).toHaveBeenCalledWith('ttm_001');
      expect(defaultProps.onUpdateTotemAttributes).toHaveBeenCalledWith(
        'ttm_001',
        expect.objectContaining({ happiness: 90 })
      );
    });
  });

  it('updates Essence balance from feed response', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Feed/ }));

    await waitFor(() => {
      expect(mockUserContext.setEssenceBalance).toHaveBeenCalledWith(4990);
    });
  });

  it('increments feed achievement progress', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Feed/ }));

    await waitFor(() => {
      expect(mockAchievementsContext.incrementAchievementProgress).toHaveBeenCalledWith('ach_feed-progression');
    });
  });

  // =========================================================================
  // TRAIN ACTION
  // =========================================================================

  it('calls train API and updates experience', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Train/ }));

    await waitFor(() => {
      expect(mockGameApi.train).toHaveBeenCalledWith('ttm_001');
      expect(defaultProps.onUpdateTotemAttributes).toHaveBeenCalledWith(
        'ttm_001',
        expect.objectContaining({ experience: 2050, happiness: 70 })
      );
    });
  });

  it('shows XP effect after training', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Train/ }));

    await waitFor(() => {
      expect(screen.getByTestId('xp-effect')).toBeInTheDocument();
    });
  });

  it('increments train achievement progress', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Train/ }));

    await waitFor(() => {
      expect(mockAchievementsContext.incrementAchievementProgress).toHaveBeenCalledWith('ach_train-progression');
    });
  });

  // =========================================================================
  // TREAT ACTION
  // =========================================================================

  it('calls treat API and updates happiness', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Treat/ }));

    await waitFor(() => {
      expect(mockGameApi.treat).toHaveBeenCalledWith('ttm_001');
      expect(defaultProps.onUpdateTotemAttributes).toHaveBeenCalledWith(
        'ttm_001',
        expect.objectContaining({ happiness: 90 })
      );
    });
  });

  it('increments treat achievement progress', async () => {
    render(<TotemDetailView {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Treat/ }));

    await waitFor(() => {
      expect(mockAchievementsContext.incrementAchievementProgress).toHaveBeenCalledWith('ach_treat-progression');
    });
  });

  // =========================================================================
  // EVOLVE ACTION
  // =========================================================================

  it('calls evolve API and shows celebration modal', async () => {
    const totem = makeTestTotem({ attributes: { experience: 3500, stage: 2, happiness: 50 } });
    render(<TotemDetailView {...defaultProps} totem={totem} />);
    await userEvent.click(screen.getByRole('button', { name: /Evolve/ }));

    await waitFor(() => {
      expect(mockGameApi.evolve).toHaveBeenCalledWith('ttm_001');
      expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
    });
  });

  it('updates stage and stat boosts on evolution', async () => {
    const totem = makeTestTotem({ attributes: { experience: 3500, stage: 2, happiness: 50 } });
    render(<TotemDetailView {...defaultProps} totem={totem} />);
    await userEvent.click(screen.getByRole('button', { name: /Evolve/ }));

    await waitFor(() => {
      expect(defaultProps.onUpdateTotemAttributes).toHaveBeenCalledWith(
        'ttm_001',
        expect.objectContaining({
          stage: 3,
          strength: expect.any(Number),
          agility: expect.any(Number),
        })
      );
    });
  });

  it('increments evolve achievement progress', async () => {
    const totem = makeTestTotem({ attributes: { experience: 3500, stage: 2, happiness: 50 } });
    render(<TotemDetailView {...defaultProps} totem={totem} />);
    await userEvent.click(screen.getByRole('button', { name: /Evolve/ }));

    await waitFor(() => {
      expect(mockAchievementsContext.incrementAchievementProgress).toHaveBeenCalledWith('ach_evolution-progression');
    });
  });

  it('closes celebration modal', async () => {
    const totem = makeTestTotem({ attributes: { experience: 3500, stage: 2, happiness: 50 } });
    render(<TotemDetailView {...defaultProps} totem={totem} />);
    await userEvent.click(screen.getByRole('button', { name: /Evolve/ }));

    await waitFor(() => {
      expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Close Celebration' }));
    expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
  });

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  it('shows error message when action fails', async () => {
    mockGameApi.feed.mockResolvedValue({ success: false, error: 'Not in feeding window' });
    render(<TotemDetailView {...defaultProps} />);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await userEvent.click(screen.getByRole('button', { name: /Feed/ }));

    await waitFor(() => {
      expect(screen.getByText('Not in feeding window')).toBeInTheDocument();
    });
  });

  it('updates happiness from error message when happiness mentioned', async () => {
    mockGameApi.evolve.mockResolvedValue({ success: false, error: 'Need 30 happiness (have 25)' });
    const totem = makeTestTotem({ attributes: { experience: 3500, stage: 2, happiness: 50 } });
    render(<TotemDetailView {...defaultProps} totem={totem} />);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await userEvent.click(screen.getByRole('button', { name: /Evolve/ }));

    await waitFor(() => {
      expect(defaultProps.onUpdateTotemAttributes).toHaveBeenCalledWith(
        'ttm_001',
        expect.objectContaining({ happiness: 25 })
      );
    });
  });

  // =========================================================================
  // EXPEDITION STATE
  // =========================================================================

  it('passes isOnExpedition to image section when totem is on expedition', () => {
    mockGameContext.isTotemAvailable.mockReturnValue(false);
    mockGameContext.expeditionState.userExpeditions = [{
      completed: false,
      totemIds: ['ttm_001'],
      endTime: Date.now() / 1000 + 7200,
    }];
    render(<TotemDetailView {...defaultProps} />);
    expect(screen.getByText('On Expedition')).toBeInTheDocument();
  });

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  it('renders navigation with prev/next', () => {
    render(<TotemDetailView {...defaultProps} />);
    const prevButtons = screen.getAllByRole('button', { name: 'Previous Totem' });
    expect(prevButtons.length).toBeGreaterThan(0);
  });
});
