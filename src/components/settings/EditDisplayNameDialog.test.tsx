import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockApi = vi.hoisted(() => ({
  updateDisplayName: vi.fn(),
}));

const mockAuth = vi.hoisted(() => ({
  refreshUser: vi.fn().mockResolvedValue(undefined),
}));

const mockUser = vi.hoisted(() => ({
  updateBalances: vi.fn().mockResolvedValue(undefined),
  essenceBalance: '2000',
}));

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../../services/ApiClient', () => ({
  default: mockApi,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUser,
}));

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  Loader2: () => <span data-testid="icon-loader" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Clock: () => <span data-testid="icon-clock" />,
  CheckCircle: () => <span data-testid="icon-check" />,
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import EditDisplayNameDialog from './EditDisplayNameDialog';

describe('EditDisplayNameDialog', () => {
  const defaultProps = {
    open: true,
    currentName: 'OldName',
    cooldown: { readyAt: null as string | null, skipCost: 500 },
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.essenceBalance = '2000';
    mockApi.updateDisplayName.mockResolvedValue({
      success: true,
      data: {
        displayName: 'NewName',
        displayNameCooldown: { readyAt: '2099-01-01T00:00:00Z', skipCost: 500 },
        skippedCooldown: false,
      },
    });
  });

  it('does not render when open=false', () => {
    render(<EditDisplayNameDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog with current name pre-filled', () => {
    render(<EditDisplayNameDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /new display name/i })).toHaveValue('OldName');
  });

  it('disables Save when name matches current', () => {
    render(<EditDisplayNameDialog {...defaultProps} />);
    const save = screen.getByRole('button', { name: /save/i });
    expect(save).toBeDisabled();
  });

  it('shows length validation error for short names', async () => {
    render(<EditDisplayNameDialog {...defaultProps} />);
    const input = screen.getByRole('textbox', { name: /new display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'ab');
    expect(screen.getByText(/3.{1,3}20 characters/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('submits valid name and calls refreshUser + onSuccess', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<EditDisplayNameDialog {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);

    const input = screen.getByRole('textbox', { name: /new display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockApi.updateDisplayName).toHaveBeenCalledWith('NewName', false);
    });
    expect(mockAuth.refreshUser).toHaveBeenCalled();
    expect(mockUser.updateBalances).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('NewName', false);
    expect(onClose).toHaveBeenCalled();
  });

  it('skip flow submits with skipCooldown=true and calls updateBalances', async () => {
    mockApi.updateDisplayName.mockResolvedValue({
      success: true,
      data: {
        displayName: 'NewName',
        displayNameCooldown: { readyAt: '2099-01-01T00:00:00Z', skipCost: 500 },
        skippedCooldown: true,
        newEssenceBalance: 1500,
      },
    });
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    render(
      <EditDisplayNameDialog
        {...defaultProps}
        cooldown={{ readyAt: future, skipCost: 500 }}
      />,
    );

    const input = screen.getByRole('textbox', { name: /new display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');

    await userEvent.click(screen.getByRole('button', { name: /change now for 500 essence/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirm.*500 essence/i }));

    await waitFor(() => {
      expect(mockApi.updateDisplayName).toHaveBeenCalledWith('NewName', true);
    });
    expect(mockUser.updateBalances).toHaveBeenCalled();
  });

  it('renders friendly error on PROFANITY response', async () => {
    mockApi.updateDisplayName.mockResolvedValue({
      success: false,
      error: { code: 'PROFANITY', message: 'rejected' },
    });
    render(<EditDisplayNameDialog {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /new display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/please choose a different name\./i)).toBeInTheDocument();
  });

  it('renders friendly error on INSUFFICIENT_BALANCE response', async () => {
    mockApi.updateDisplayName.mockResolvedValue({
      success: false,
      error: { code: 'INSUFFICIENT_BALANCE', message: 'low' },
    });
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    render(
      <EditDisplayNameDialog
        {...defaultProps}
        cooldown={{ readyAt: future, skipCost: 500 }}
      />,
    );

    const input = screen.getByRole('textbox', { name: /new display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');
    await userEvent.click(screen.getByRole('button', { name: /change now for 500 essence/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirm.*500 essence/i }));

    expect(await screen.findByText(/you need 500 essence/i)).toBeInTheDocument();
  });

  it('Escape key closes the dialog', async () => {
    const onClose = vi.fn();
    render(<EditDisplayNameDialog {...defaultProps} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
