import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockFetchTotems = vi.hoisted(() => vi.fn());

const mockUserContext = vi.hoisted(() => ({
  totems: [] as any[],
  totemLoading: false,
  totemError: null as string | null,
  fetchTotems: mockFetchTotems,
  updateTotemAttributes: vi.fn(),
}));

const mockAuthContext = vi.hoisted(() => ({
  isAuthenticated: true,
}));

const mockGameContext = vi.hoisted(() => ({
  isTotemAvailable: vi.fn().mockReturnValue(true),
  expeditionState: { userExpeditions: [] as any[] },
}));

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUserContext,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

vi.mock('../../contexts/GameContext', () => ({
  useGame: () => mockGameContext,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ state: null }),
}));

vi.mock('../../utils/species', () => ({
  getTotemImageUrl: () => '/test-image.png',
}));

vi.mock('../layouts/GalleryToolbar', () => ({
  default: () => <div data-testid="toolbar" />,
}));

vi.mock('./TotemGalleryStats', () => ({
  default: () => <div data-testid="stats" />,
}));

vi.mock('../TotemDetailView', () => ({
  default: () => <div data-testid="detail-view" />,
}));

vi.mock('../TotemGridAndListView', () => ({
  TotemGridCard: () => <div data-testid="grid-card" />,
  TotemListRow: () => <div data-testid="list-row" />,
}));

import TotemGallery from './TotemGallery';

// ============================================================================
// TESTS
// ============================================================================

describe('TotemGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call fetchTotems on mount (UserContext handles this)', () => {
    render(<TotemGallery />);

    // UserContext.tsx:572-579 already calls fetchTotems when isAuthenticated changes.
    // Components that consume totems from context must NOT duplicate this fetch.
    // If this fails, a component-level useEffect is re-fetching totems.
    expect(mockFetchTotems).not.toHaveBeenCalled();
  });

  it('renders totems from context without triggering a fetch', () => {
    mockUserContext.totems = [
      {
        id: 'totem-1',
        name: 'Wolf',
        displayName: 'Gray Pup',
        description: 'A wolf',
        image: '/wolf.png',
        affinity: 'fire',
        domain: 'forest',
        attributes: {
          species: 0, color: 0, rarity: 0,
          happiness: 50, experience: 100, stage: 0,
          strength: 10, agility: 10, wisdom: 10,
          isStaked: false, nickname: null, prestigeLevel: 0,
        },
        trackings: {},
      },
    ] as any[];

    render(<TotemGallery />);

    // Should render the totem from context state, not fetch fresh
    expect(mockFetchTotems).not.toHaveBeenCalled();
  });

  it('only calls fetchTotems on error retry button click', async () => {
    // Set error state before render
    mockUserContext.totemError = 'Failed to load';
    mockUserContext.totemLoading = false;
    mockUserContext.totems = [];

    render(<TotemGallery />);

    // fetchTotems is wired to the "Try Again" button, that's the only valid call site
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    retryBtn.click();

    expect(mockFetchTotems).toHaveBeenCalledTimes(1);
  });
});
