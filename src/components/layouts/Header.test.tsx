import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

const mockClaimDailyReward = vi.fn().mockResolvedValue(undefined);
const mockRefreshRewardStatus = vi.fn();

const authState = {
  isAuthenticated: true,
  user: { id: 'usr_1', email: 'test@example.com', displayName: 'TestPlayer', tier: 'free' },
};

const gameState: {
  rewardsState: { streakStatus: { streakDays: number; canClaimToday: boolean } | null };
} = {
  rewardsState: { streakStatus: { streakDays: 5, canClaimToday: true } },
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../../contexts/GameContext', () => ({
  useGame: () => ({
    rewardsState: gameState.rewardsState,
    claimDailyReward: mockClaimDailyReward,
    refreshRewardStatus: mockRefreshRewardStatus,
  }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock('./LoginButton', () => ({ LoginButton: () => <div>LoginButton</div> }));
vi.mock('./UserMenu', () => ({ UserMenu: () => <div>UserMenu</div> }));
vi.mock('./ThemeToggle', () => ({ ThemeToggle: () => <div>ThemeToggle</div> }));
vi.mock('../NotificationsPanel', () => ({ default: () => <div>NotificationsPanel</div> }));

import Header from './Header';

describe('Header — mobile streak banner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = true;
    gameState.rewardsState = { streakStatus: { streakDays: 5, canClaimToday: true } };
  });

  it('renders when user is authenticated and can claim today', () => {
    render(<Header />);
    const banner = screen.getByTestId('mobile-streak-banner');
    expect(banner).toBeInTheDocument();
    expect(within(banner).getByText('Day 5 Streak!')).toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: 'Claim Reward' })).toBeInTheDocument();
  });

  it('does NOT render when canClaimToday is false (already claimed today)', () => {
    gameState.rewardsState = { streakStatus: { streakDays: 5, canClaimToday: false } };
    render(<Header />);
    expect(screen.queryByTestId('mobile-streak-banner')).not.toBeInTheDocument();
  });

  it('does NOT render when streakStatus is missing', () => {
    gameState.rewardsState = { streakStatus: null };
    render(<Header />);
    expect(screen.queryByTestId('mobile-streak-banner')).not.toBeInTheDocument();
  });

  it('does NOT render when the user is not authenticated', () => {
    authState.isAuthenticated = false;
    render(<Header />);
    expect(screen.queryByTestId('mobile-streak-banner')).not.toBeInTheDocument();
  });

  it('invokes claimDailyReward when the Claim Reward button is clicked', async () => {
    render(<Header />);
    const banner = screen.getByTestId('mobile-streak-banner');
    fireEvent.click(within(banner).getByRole('button', { name: 'Claim Reward' }));
    await waitFor(() => {
      expect(mockClaimDailyReward).toHaveBeenCalledTimes(1);
    });
  });

  it('hides the banner when the Close button is clicked', () => {
    render(<Header />);
    const banner = screen.getByTestId('mobile-streak-banner');
    fireEvent.click(within(banner).getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('mobile-streak-banner')).not.toBeInTheDocument();
  });
});
