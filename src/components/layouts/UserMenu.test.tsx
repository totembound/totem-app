import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockNavigate = vi.fn();
const mockSetTutorialWizardVisible = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'usr_1', email: 'test@example.com', displayName: 'TestPlayer', tier: 'free' },
    logout: mockLogout,
  }),
}));

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    essenceBalance: '5000',
    gemsBalance: '100',
    setTutorialWizardVisible: mockSetTutorialWizardVisible,
  }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, onClick, ...props }: any) => (
    <a href={to} onClick={onClick} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}));

import { UserMenu } from './UserMenu';

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user button with display name', () => {
    render(<UserMenu />);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
  });

  it('should open dropdown on click', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('TestPlayer'));
    expect(screen.getByText('Log Out')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should display currency balances', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('TestPlayer'));
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should display Free tier badge', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('TestPlayer'));
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders the trigger avatar (initials fallback when no avatar set)', () => {
    render(<UserMenu />);
    // Initials for "TestPlayer" — single word, first 2 chars uppercase = "TE".
    // The trigger renders an Avatar component; the button label is "TE TestPlayer".
    const triggerButton = screen.getByRole('button', { name: /TestPlayer/ });
    expect(triggerButton).toBeInTheDocument();
    // The Avatar component for null avatar renders a span with the initials text.
    expect(screen.getByText('TE')).toBeInTheDocument();
  });

  it('renders displayName + email + tier badge in dropdown header', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('TestPlayer'));
    // displayName appears in the dropdown header (along with the trigger button).
    const playerOccurrences = screen.getAllByText('TestPlayer');
    expect(playerOccurrences.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('should call logout and navigate on Log Out click', async () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('TestPlayer'));
    fireEvent.click(screen.getByText('Log Out'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show tutorial on Show Tutorial click', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('TestPlayer'));
    fireEvent.click(screen.getByText('Show Tutorial'));

    expect(mockSetTutorialWizardVisible).toHaveBeenCalledWith(true);
  });

  it('should close menu after Log Out', async () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('TestPlayer'));
    expect(screen.getByText('Log Out')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Log Out'));

    await waitFor(() => {
      expect(screen.queryByText('Log Out')).not.toBeInTheDocument();
    });
  });
});
