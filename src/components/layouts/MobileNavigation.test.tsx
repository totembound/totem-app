import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockNavigate = vi.fn();
const mockSetTutorialWizardVisible = vi.fn();

let mockUserState = {
  isSignedUp: true,
  essenceBalance: '3000',
  gemsBalance: '50',
  tutorialWizardVisible: false,
  setTutorialWizardVisible: mockSetTutorialWizardVisible,
};

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUserState,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, className }: any) => {
    const cls = typeof className === 'function' ? className({ isActive: false }) : className;
    return <a href={to} className={cls}>{children}</a>;
  },
  useNavigate: () => mockNavigate,
}));

import MobileNavigation from './MobileNavigation';

describe('MobileNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserState = {
      isSignedUp: true,
      essenceBalance: '3000',
      gemsBalance: '50',
      tutorialWizardVisible: false,
      setTutorialWizardVisible: mockSetTutorialWizardVisible,
    };
  });

  it('should render main nav items', () => {
    render(<MobileNavigation />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Totems')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
    expect(screen.getByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('should open more menu on More click', () => {
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    expect(screen.getByText('Challenges')).toBeInTheDocument();
    expect(screen.getByText('Expeditions')).toBeInTheDocument();
    expect(screen.getByText('Forge')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('should call logout on Log Out click', () => {
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    fireEvent.click(screen.getByText('Log Out'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should close menu after Log Out click', () => {
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    expect(screen.getByText('Log Out')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Log Out'));
    expect(screen.queryByText('Challenges')).not.toBeInTheDocument();
  });

  it('should display balances when signed up', () => {
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    expect(screen.getByText('Balances')).toBeInTheDocument();
    expect(screen.getByText('3,000')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should not display balances when not signed up', () => {
    mockUserState = { ...mockUserState, isSignedUp: false };
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    expect(screen.queryByText('Balances')).not.toBeInTheDocument();
  });

  it('should show tutorial button when signed up and tutorial hidden', () => {
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    expect(screen.getByText('Show Tutorial')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show Tutorial'));
    expect(mockSetTutorialWizardVisible).toHaveBeenCalledWith(true);
  });

  it('should hide tutorial button when tutorial already visible', () => {
    mockUserState = { ...mockUserState, tutorialWizardVisible: true };
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    expect(screen.queryByText('Show Tutorial')).not.toBeInTheDocument();
  });

  it('should navigate to settings on Settings click', () => {
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    fireEvent.click(screen.getByText('Account Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/account/settings');
  });

  it('should navigate to terms on Terms click', () => {
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    fireEvent.click(screen.getByText('Terms'));
    expect(mockNavigate).toHaveBeenCalledWith('/terms');
  });

  it('should navigate to privacy on Privacy click', () => {
    render(<MobileNavigation />);
    fireEvent.click(screen.getByText('More'));
    fireEvent.click(screen.getByText('Privacy'));
    expect(mockNavigate).toHaveBeenCalledWith('/privacy');
  });
});
