import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TierBonusBadge from './TierBonusBadge';

describe('TierBonusBadge', () => {
  it('renders nothing for free tier', () => {
    const { container } = render(<TierBonusBadge tier="free" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when tier is undefined', () => {
    const { container } = render(<TierBonusBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders +100% Tier in purple for premium', () => {
    render(<TierBonusBadge tier="premium" />);
    const chip = screen.getByText(/\+100% Tier/);
    expect(chip).toBeInTheDocument();
    expect(chip.className).toMatch(/text-purple-600/);
  });

  it('renders +200% Tier in amber for vip', () => {
    render(<TierBonusBadge tier="vip" />);
    const chip = screen.getByText(/\+200% Tier/);
    expect(chip).toBeInTheDocument();
    expect(chip.className).toMatch(/text-amber-500/);
  });

  it('accepts a custom label', () => {
    render(<TierBonusBadge tier="vip" label="VIP Bonus" />);
    expect(screen.getByText(/\+200% VIP Bonus/)).toBeInTheDocument();
  });
});
