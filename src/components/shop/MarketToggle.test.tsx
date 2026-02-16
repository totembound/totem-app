import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import MarketToggle from './MarketToggle';

describe('MarketToggle', () => {
  it('renders both Browse Market and Sell Your Totems buttons', () => {
    render(<MarketToggle mode="browse" onModeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Browse Market/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sell Your Totems/i })).toBeInTheDocument();
  });

  it('applies active styling to Browse when mode is browse', () => {
    render(<MarketToggle mode="browse" onModeChange={vi.fn()} />);
    const browseBtn = screen.getByRole('button', { name: /Browse Market/i });
    const sellBtn = screen.getByRole('button', { name: /Sell Your Totems/i });
    expect(browseBtn.className).toContain('border-purple-500');
    expect(sellBtn.className).not.toContain('border-purple-500');
  });

  it('applies active styling to Sell when mode is sell', () => {
    render(<MarketToggle mode="sell" onModeChange={vi.fn()} />);
    const browseBtn = screen.getByRole('button', { name: /Browse Market/i });
    const sellBtn = screen.getByRole('button', { name: /Sell Your Totems/i });
    expect(sellBtn.className).toContain('border-purple-500');
    expect(browseBtn.className).not.toContain('border-purple-500');
  });

  it('calls onModeChange with "sell" when Sell is clicked', async () => {
    const onModeChange = vi.fn();
    render(<MarketToggle mode="browse" onModeChange={onModeChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Sell Your Totems/i }));
    expect(onModeChange).toHaveBeenCalledWith('sell');
  });

  it('calls onModeChange with "browse" when Browse is clicked', async () => {
    const onModeChange = vi.fn();
    render(<MarketToggle mode="sell" onModeChange={onModeChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Browse Market/i }));
    expect(onModeChange).toHaveBeenCalledWith('browse');
  });

  it('has minimum 44px touch target height', () => {
    render(<MarketToggle mode="browse" onModeChange={vi.fn()} />);
    const browseBtn = screen.getByRole('button', { name: /Browse Market/i });
    const sellBtn = screen.getByRole('button', { name: /Sell Your Totems/i });
    expect(browseBtn.className).toContain('min-h-[44px]');
    expect(sellBtn.className).toContain('min-h-[44px]');
  });
});
