import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import MessageDialog from './MessageDialog';

describe('MessageDialog', () => {
  const defaultProps = {
    title: 'Test Title',
    isOpen: true,
    showDismiss: true,
    onClose: vi.fn(),
  };

  // =========================================================================
  // VISIBILITY
  // =========================================================================

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <MessageDialog {...defaultProps} isOpen={false}>
        Content
      </MessageDialog>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when isOpen is true', () => {
    render(
      <MessageDialog {...defaultProps}>
        <p>Hello</p>
      </MessageDialog>
    );
    expect(screen.getByRole('heading', { name: /test title/i })).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  // =========================================================================
  // CLOSE BUTTON
  // =========================================================================

  it('renders close (X) button and calls onClose when clicked', async () => {
    const onClose = vi.fn();
    render(
      <MessageDialog {...defaultProps} onClose={onClose}>
        Content
      </MessageDialog>
    );
    // The X button is the first button rendered (before any dismiss buttons)
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // "TRY AGAIN" BUTTON (showDismiss=true, not rate limit, not success)
  // =========================================================================

  it('shows "Try Again" button when showDismiss=true and not rate-limit or success', () => {
    render(
      <MessageDialog {...defaultProps} showDismiss={true} isRateLimit={false} isSuccess={false}>
        Error message
      </MessageDialog>
    );
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Awesome!' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Understood' })).not.toBeInTheDocument();
  });

  it('"Try Again" calls onClose when clicked', async () => {
    const onClose = vi.fn();
    render(
      <MessageDialog {...defaultProps} onClose={onClose}>
        Error
      </MessageDialog>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onClose).toHaveBeenCalled();
  });

  // =========================================================================
  // "AWESOME!" BUTTON (isSuccess=true)
  // =========================================================================

  it('shows "Awesome!" button when isSuccess is true', () => {
    render(
      <MessageDialog {...defaultProps} isSuccess={true}>
        Success!
      </MessageDialog>
    );
    expect(screen.getByRole('button', { name: 'Awesome!' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Understood' })).not.toBeInTheDocument();
  });

  it('"Awesome!" calls onClose when clicked', async () => {
    const onClose = vi.fn();
    render(
      <MessageDialog {...defaultProps} isSuccess={true} onClose={onClose}>
        Done
      </MessageDialog>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Awesome!' }));
    expect(onClose).toHaveBeenCalled();
  });

  // =========================================================================
  // "UNDERSTOOD" BUTTON (isRateLimit=true)
  // =========================================================================

  it('shows "Understood" button when isRateLimit is true', () => {
    render(
      <MessageDialog {...defaultProps} isRateLimit={true}>
        Rate limited
      </MessageDialog>
    );
    expect(screen.getByRole('button', { name: 'Understood' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Awesome!' })).not.toBeInTheDocument();
  });

  it('"Understood" calls onClose when clicked', async () => {
    const onClose = vi.fn();
    render(
      <MessageDialog {...defaultProps} isRateLimit={true} onClose={onClose}>
        Slow down
      </MessageDialog>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Understood' }));
    expect(onClose).toHaveBeenCalled();
  });

  // =========================================================================
  // NO DISMISS BUTTON
  // =========================================================================

  it('hides dismiss button when showDismiss is false', () => {
    render(
      <MessageDialog {...defaultProps} showDismiss={false} isRateLimit={false} isSuccess={false}>
        Loading...
      </MessageDialog>
    );
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Awesome!' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Understood' })).not.toBeInTheDocument();
  });

  // =========================================================================
  // CHILDREN RENDERING
  // =========================================================================

  it('renders children content', () => {
    render(
      <MessageDialog {...defaultProps}>
        <span>Custom content</span>
      </MessageDialog>
    );
    expect(screen.getByText(/custom content/i)).toBeInTheDocument();
  });

  it('renders title text', () => {
    render(
      <MessageDialog {...defaultProps} title="Purchase Failed">
        Something went wrong
      </MessageDialog>
    );
    expect(screen.getByRole('heading', { name: /purchase failed/i })).toBeInTheDocument();
  });
});
