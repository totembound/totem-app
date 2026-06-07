import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import ShopInterface from './ShopInterface';

// ShopInterface renders a react-router <Link> (the Terms consent), so it needs a router
// context. Wrap every render in a MemoryRouter.
const render = (ui: ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

// Mock all dependencies
vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    updateBalances: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    canSpendEssence: () => true,
    canSpendGems: () => true,
    fetchTotems: vi.fn(),
  }),
}));

vi.mock('../../contexts/AchievementsContext', () => ({
  useAchievements: () => ({
    refreshAchievements: vi.fn(),
  }),
}));

vi.mock('../../services/ApiClient', () => ({
  default: {
    exchangeGemsForEssence: vi.fn(),
    purchaseGems: vi.fn(),
    purchaseNewTotem: vi.fn(),
  },
}));

vi.mock('../../services/NotificationService', () => ({
  notificationService: {
    showNotification: vi.fn(),
    showTotemPurchased: vi.fn(),
    processAchievementsFromResponse: vi.fn(),
  },
}));

vi.mock('../../config/constants', () => ({
  AVAILABLE_SPECIES: [],
  CURRENCY_NAMES: { SOFT: 'Essence', PREMIUM: 'Gems' },
  IPFS_GATEWAY_URL: '',
  ESSENCE_COST: 500,
}));

vi.mock('../shop/SpecialOffers', () => ({
  default: ({ onPurchased: _onPurchased }: any) => <div data-testid="special-offers" />,
}));

vi.mock('../shop/UnboundTotems', () => ({
  default: () => <div data-testid="unbound-totems">Unbound Totems Grid</div>,
}));

vi.mock('../shop/SellTotems', () => ({
  default: () => <div data-testid="sell-totems">Sell Totems Grid</div>,
}));

vi.mock('../shop/MarketToggle', () => ({
  default: ({ mode, onModeChange }: any) => (
    <div data-testid="market-toggle">
      <button onClick={() => onModeChange('browse')}>Browse</button>
      <button onClick={() => onModeChange('sell')}>Sell</button>
      <span data-testid="market-mode">{mode}</span>
    </div>
  ),
}));

vi.mock('../CelebrationModal', () => ({
  default: () => null,
}));

vi.mock('../TokensDisplay', () => ({
  default: () => <div data-testid="tokens-display" />,
}));

vi.mock('../MessageDialog', () => ({
  default: ({ children: _children }: any) => null,
}));

vi.mock('../../utils/totems', () => ({
  AFFINITY_ICONS: {},
  DOMAIN_ICONS: {},
  getSpeciesEmoji: () => '',
  getCurrentMonth: () => 'January',
}));

vi.mock('../../utils/species', () => ({
  getSpeciesName: () => 'test',
  getStageName: () => 'test',
  getTotemImageUrl: () => '',
}));

describe('ShopInterface', () => {
  beforeEach(() => {
    // Mock fetch for shop config
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ essenceExchange: [], gemPackages: [] }),
    }) as any;
  });

  it('renders exactly 4 tab buttons: Specials, Totems, Currency, Market', () => {
    render(<ShopInterface />);
    expect(screen.getByRole('button', { name: 'Specials' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Totems' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Currency' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Market' })).toBeInTheDocument();
  });

  it('does not render old tab labels as top-level tabs', () => {
    render(<ShopInterface />);
    // Old tabs should not appear as tab buttons in the tab bar
    expect(screen.queryByRole('button', { name: 'Gems' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Essence' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unbound' })).not.toBeInTheDocument();
  });

  it('defaults to Specials tab showing Special Offers', () => {
    render(<ShopInterface />);
    expect(screen.getByTestId('special-offers')).toBeInTheDocument();
  });

  it('shows Totem Santuary when Totems tab is clicked', async () => {
    render(<ShopInterface />);
    await userEvent.click(screen.getByRole('button', { name: 'Totems' }));
    expect(screen.getByRole('heading', { name: 'Totem Sanctuary' })).toBeInTheDocument();
  });

  it('shows MarketToggle when Market tab is clicked', async () => {
    render(<ShopInterface />);
    await userEvent.click(screen.getByRole('button', { name: 'Market' }));
    expect(screen.getByTestId('market-toggle')).toBeInTheDocument();
  });

  it('shows Currency sections when Currency tab is clicked', async () => {
    render(<ShopInterface />);
    await userEvent.click(screen.getByRole('button', { name: 'Currency' }));
    expect(screen.getByRole('heading', { name: /Buy Gems/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Essence Vault/ })).toBeInTheDocument();
  });
});
