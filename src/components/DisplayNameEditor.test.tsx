import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockUserContext = vi.hoisted(() => ({
  showError: vi.fn(),
  handleRateLimitError: vi.fn(),
}));

const mockGameContext = vi.hoisted(() => ({
  setNickname: vi.fn().mockResolvedValue(undefined),
}));

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../contexts/UserContext', () => ({
  useUser: () => mockUserContext,
}));

vi.mock('../contexts/GameContext', () => ({
  useGame: () => mockGameContext,
}));

vi.mock('lucide-react', () => ({
  Check: ({ size: _size }: any) => <span data-testid="icon-check" />,
  X: ({ size: _size }: any) => <span data-testid="icon-x" />,
  Loader2: ({ size: _size, className: _className }: any) => <span data-testid="icon-loader" />,
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import DisplayNameEditor from './DisplayNameEditor';
import { RateLimitError } from '../types/types';

describe('DisplayNameEditor', () => {
  const defaultProps = {
    totemId: 'ttm_001',
    currentName: 'Fang',
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameContext.setNickname.mockResolvedValue(undefined);
  });

  // =========================================================================
  // RENDER
  // =========================================================================

  it('renders input with current name', () => {
    render(<DisplayNameEditor {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Fang');
  });

  it('renders save and cancel buttons', () => {
    render(<DisplayNameEditor {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Save nickname' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel editing' })).toBeInTheDocument();
  });

  it('auto-focuses input on mount', () => {
    render(<DisplayNameEditor {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(document.activeElement).toBe(input);
  });

  it('defaults to empty string when currentName is empty', () => {
    render(<DisplayNameEditor {...defaultProps} currentName="" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  // =========================================================================
  // SUBMIT (Save button)
  // =========================================================================

  it('calls setNickname with trimmed name on save click', async () => {
    render(<DisplayNameEditor {...defaultProps} />);
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.type(input, '  Wolfy  ');
    await userEvent.click(screen.getByRole('button', { name: 'Save nickname' }));

    expect(mockGameContext.setNickname).toHaveBeenCalledWith('ttm_001', 'Wolfy');
  });

  it('calls onSuccess and onClose after successful save', async () => {
    render(<DisplayNameEditor {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save nickname' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith('Fang');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('sends null when name is cleared (empty after trim)', async () => {
    render(<DisplayNameEditor {...defaultProps} />);
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.click(screen.getByRole('button', { name: 'Save nickname' }));

    expect(mockGameContext.setNickname).toHaveBeenCalledWith('ttm_001', '');
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(null);
    });
  });

  // =========================================================================
  // KEYBOARD HANDLING
  // =========================================================================

  it('submits on Enter key', async () => {
    render(<DisplayNameEditor {...defaultProps} />);
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.type(input, 'Shadow{Enter}');

    expect(mockGameContext.setNickname).toHaveBeenCalledWith('ttm_001', 'Shadow');
  });

  it('calls onClose on Escape key', async () => {
    render(<DisplayNameEditor {...defaultProps} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '{Escape}');

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockGameContext.setNickname).not.toHaveBeenCalled();
  });

  // =========================================================================
  // CANCEL
  // =========================================================================

  it('calls onClose when cancel button clicked', async () => {
    render(<DisplayNameEditor {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel editing' }));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockGameContext.setNickname).not.toHaveBeenCalled();
  });

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  it('handles RateLimitError by calling handleRateLimitError', async () => {
    const rateLimitErr = new RateLimitError('Rate limit exceeded', 'resetTime', 10, 5);
    mockGameContext.setNickname.mockRejectedValue(rateLimitErr);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DisplayNameEditor {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save nickname' }));

    await waitFor(() => {
      expect(mockUserContext.handleRateLimitError).toHaveBeenCalledWith(rateLimitErr);
    });
    expect(mockUserContext.showError).not.toHaveBeenCalled();
  });

  it('shows generic error for non-rate-limit errors', async () => {
    mockGameContext.setNickname.mockRejectedValue(new Error('Server error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DisplayNameEditor {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save nickname' }));

    await waitFor(() => {
      expect(mockUserContext.showError).toHaveBeenCalledWith(
        'Error',
        'Failed to update name. Try again shortly.'
      );
    });
    expect(mockUserContext.handleRateLimitError).not.toHaveBeenCalled();
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  it('disables input and buttons while submitting', async () => {
    // Make setNickname hang to test loading state
    let resolveNickname: () => void;
    mockGameContext.setNickname.mockImplementation(
      () => new Promise<void>(resolve => { resolveNickname = resolve; })
    );

    render(<DisplayNameEditor {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save nickname' }));

    // While submitting, input should be disabled
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save nickname' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel editing' })).toBeDisabled();

    // Shows loader icon
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();

    // Resolve to clean up
    resolveNickname!();
  });

  it('has maxLength of 32 on input', () => {
    render(<DisplayNameEditor {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '32');
  });
});
