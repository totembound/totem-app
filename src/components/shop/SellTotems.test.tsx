import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockUserContext = vi.hoisted(() => ({
  totems: [] as any[],
  removeTotem: vi.fn(),
  updateBalances: vi.fn().mockResolvedValue(undefined),
}));

const mockGameContext = vi.hoisted(() => ({
  isTotemAvailable: vi.fn().mockReturnValue(true),
  expeditionState: { userExpeditions: [] as any[] },
}));

const mockApiClient = vi.hoisted(() => ({
  listTotemForSale: vi.fn().mockResolvedValue({ success: true }),
}));

const mockNotificationService = vi.hoisted(() => ({
  showNotification: vi.fn(),
}));

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUserContext,
}));

vi.mock('../../contexts/GameContext', () => ({
  useGame: () => mockGameContext,
}));

vi.mock('../../services/ApiClient', () => ({
  default: mockApiClient,
}));

vi.mock('../../services/NotificationService', () => ({
  notificationService: mockNotificationService,
}));

vi.mock('../../config/constants', () => ({
  CURRENCY_NAMES: { SOFT: 'Essence', PREMIUM: 'Gems' },
  IPFS_GATEWAY_URL: 'https://ipfs.test/',
}));

vi.mock('../../utils/totems', () => ({
  getRarityBadgeColor: () => 'bg-gray-100 text-gray-800',
}));

vi.mock('../../utils/formats', () => ({
  formatTimeRemaining: () => '2h 30m',
}));

vi.mock('../../types/notifications', () => ({
  NotificationType: { TOTEM_SALE: 'totem_sale' },
}));

vi.mock('../MessageDialog', () => ({
  default: ({ title, isOpen, children }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="message-dialog">
        <h2>{title}</h2>
        {children}
      </div>
    );
  },
}));

vi.mock('../layouts/Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      Page {currentPage}/{totalPages}
      <button onClick={() => onPageChange(2)}>Next</button>
    </div>
  ),
}));

// Partial mock — real lucide-react is the source so transitive imports (e.g. trait icons)
// keep working, but a handful of icons used by the component itself are replaced with
// text spans so assertions can target them.
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ArrowUpDown: ({ className }: any) => <span className={className}>sort</span>,
    Clock: () => <span>clock</span>,
    Heart: () => <span>heart</span>,
    Loader2: ({ className }: any) => <span className={className}>loading</span>,
    MapPin: ({ className }: any) => <span className={className}>pin</span>,
    Sparkles: () => <span>sparkles</span>,
    Info: () => <span>info</span>,
  };
});

// ============================================================================
// TEST DATA
// ============================================================================

const makeMockTotem = (overrides: any = {}) => ({
  id: overrides.id || 'ttm_001',
  name: overrides.name || 'Wolf',
  displayName: overrides.displayName || 'Gray Pup',
  image: overrides.image || 'https://ipfs.test/wolf.png',
  affinity: overrides.affinity || 'Strength',
  domain: overrides.domain || 'Earth',
  description: '',
  attributes: {
    species: 2,
    color: 0,
    rarity: 0,        // Common
    happiness: 80,
    experience: 2000,
    stage: 2,
    strength: 15,
    agility: 8,
    wisdom: 5,
    nickname: null,
    prestigeLevel: 0,
    ...overrides.attributes,
  },
  trackings: {},
});

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import SellTotems from './SellTotems';

describe('SellTotems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient.listTotemForSale.mockResolvedValue({ success: true });
    mockUserContext.updateBalances.mockResolvedValue(undefined);
    mockGameContext.isTotemAvailable.mockReturnValue(true);
    mockGameContext.expeditionState.userExpeditions = [];
  });

  // =========================================================================
  // EMPTY STATE
  // =========================================================================

  it('shows "No Totems found" when user has no totems', () => {
    mockUserContext.totems = [];
    render(<SellTotems />);
    expect(screen.getByRole('heading', { name: /no totems found to sell/i })).toBeInTheDocument();
  });

  // =========================================================================
  // SELL PRICING FORMULA
  // =========================================================================

  it('shows correct sell price: 300 + (stage * 30) + (rarity * 20)', () => {
    // stage=2, rarity=0 (Common) → 300 + 60 + 0 = 360
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    expect(screen.getByText(/360/)).toBeInTheDocument();
    expect(screen.getByText(/Essence/)).toBeInTheDocument();
  });

  it('includes rarity bonus in price', () => {
    // stage=1, rarity=3 (Epic) → 300 + 30 + 60 = 390
    mockUserContext.totems = [makeMockTotem({
      id: 'ttm_epic',
      attributes: { stage: 1, rarity: 3 },
    })];
    render(<SellTotems />);
    expect(screen.getByText(/390/)).toBeInTheDocument();
  });

  // =========================================================================
  // TOTEM DISPLAY
  // =========================================================================

  it('renders totem cards with name and species', () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    expect(screen.getByRole('heading', { name: /gray pup/i })).toBeInTheDocument();
    // "Wolf" also appears in filter options, so use getAllByText
    const wolfElements = screen.getAllByText('Wolf');
    expect(wolfElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows stage and rarity badges', () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    // "Stage 3" and "Common" also appear in filter options
    const stageElements = screen.getAllByText('Stage 3');
    expect(stageElements.length).toBeGreaterThanOrEqual(1);
    const commonElements = screen.getAllByText('Common');
    expect(commonElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows happiness and experience', () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  // =========================================================================
  // EXPEDITION STATUS
  // =========================================================================

  it('shows "On Expedition" badge for totems on expedition', () => {
    mockUserContext.totems = [makeMockTotem()];
    mockGameContext.isTotemAvailable.mockReturnValue(false);
    mockGameContext.expeditionState.userExpeditions = [{
      completed: false,
      totemIds: ['ttm_001'],
      endTime: Math.floor(Date.now() / 1000) + 7200,
    }];
    render(<SellTotems />);
    const expeditionElements = screen.getAllByText('On Expedition');
    expect(expeditionElements.length).toBeGreaterThanOrEqual(1);
  });

  it('disables sell button for totems on expedition', () => {
    mockUserContext.totems = [makeMockTotem()];
    mockGameContext.isTotemAvailable.mockReturnValue(false);
    render(<SellTotems />);
    const sellBtn = screen.getByRole('button', { name: 'On Expedition' });
    expect(sellBtn).toBeDisabled();
  });

  // =========================================================================
  // SELL CONFIRMATION
  // =========================================================================

  it('opens confirmation dialog when Sell Totem clicked', async () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);

    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));

    expect(screen.getByTestId('message-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to sell/)).toBeInTheDocument();
  });

  it('shows warning about permanent removal', async () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));

    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it('closes confirmation on Cancel click', async () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));

    // Click Cancel in the dialog
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByTestId('message-dialog')).not.toBeInTheDocument();
  });

  // =========================================================================
  // CONFIRM SALE (API)
  // =========================================================================

  it('calls listTotemForSale on confirm', async () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Sale' }));

    await waitFor(() => {
      expect(mockApiClient.listTotemForSale).toHaveBeenCalledWith('ttm_001', 360);
    });
  });

  it('updates balances after successful sale', async () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Sale' }));

    await waitFor(() => {
      expect(mockUserContext.updateBalances).toHaveBeenCalled();
    });
  });

  it('removes totem from local state after successful sale', async () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Sale' }));

    await waitFor(() => {
      expect(mockUserContext.removeTotem).toHaveBeenCalledWith('ttm_001');
    });
  });

  it('shows notification after successful sale', async () => {
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Sale' }));

    await waitFor(() => {
      expect(mockNotificationService.showNotification).toHaveBeenCalledWith(
        'totem_sale',
        expect.stringContaining('Gray Pup'),
        expect.objectContaining({ totemId: 'ttm_001', price: 360 })
      );
    });
  });

  it('shows error when sale fails', async () => {
    mockApiClient.listTotemForSale.mockResolvedValue({
      success: false,
      error: { message: 'Insufficient balance' },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Sale' }));

    await waitFor(() => {
      expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
    });
    // Modal stays open for retry
    expect(screen.getByTestId('message-dialog')).toBeInTheDocument();
  });

  it('does not remove totem on failed sale', async () => {
    mockApiClient.listTotemForSale.mockResolvedValue({
      success: false,
      error: { message: 'Failed' },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUserContext.totems = [makeMockTotem()];
    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Sale' }));

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
    expect(mockUserContext.removeTotem).not.toHaveBeenCalled();
  });

  // =========================================================================
  // DOES NOT SELL EXPEDITION TOTEM
  // =========================================================================

  it('blocks sell of totem on expedition even if button somehow enabled', async () => {
    mockUserContext.totems = [makeMockTotem()];
    // Start available so sell button renders
    mockGameContext.isTotemAvailable.mockReturnValue(true);

    render(<SellTotems />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell Totem' }));

    // Now make totem unavailable before confirm
    mockGameContext.isTotemAvailable.mockReturnValue(false);
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Sale' }));

    // Should NOT call API since totem became unavailable
    expect(mockApiClient.listTotemForSale).not.toHaveBeenCalled();
  });

  // =========================================================================
  // MULTIPLE TOTEMS
  // =========================================================================

  it('renders multiple totem cards', () => {
    mockUserContext.totems = [
      makeMockTotem({ id: 'ttm_001', displayName: 'Gray Pup' }),
      makeMockTotem({ id: 'ttm_002', displayName: 'Forest Owl', name: 'Owl', attributes: { species: 11, rarity: 1, stage: 1 } }),
    ];
    render(<SellTotems />);
    expect(screen.getByRole('heading', { name: /gray pup/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /forest owl/i })).toBeInTheDocument();
  });
});
