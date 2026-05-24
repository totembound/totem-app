import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CelebrationModal from './CelebrationModal';
import { Rarity } from '../types/types';

const baseTotem = {
  name: 'Wolf',
  image: '/wolf.png',
  attributes: {
    rarity: Rarity.Rare,
    displayName: 'Gray Pup',
    stage: 0,
    domain: 'Earth',
  },
};

describe('CelebrationModal innate trait badge', () => {
  it('shows the innate trait name when innateTraitId is provided', () => {
    render(
      <CelebrationModal
        type="purchase"
        totem={baseTotem}
        innateTraitId="trt_curious"
        onClose={() => {}}
      />
    );
    // 'Curious' is the display name of the trt_curious innate trait.
    expect(screen.getByText('Curious')).toBeInTheDocument();
    expect(screen.getByTitle('Born trait: Curious')).toBeInTheDocument();
  });

  it('renders no trait badge when innateTraitId is absent', () => {
    render(
      <CelebrationModal type="loot_claim" totem={baseTotem} onClose={() => {}} />
    );
    expect(screen.queryByText('Curious')).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Born trait:/)).not.toBeInTheDocument();
  });

  it('renders no badge for an unknown trait id (legacy/no-trait totems)', () => {
    render(
      <CelebrationModal
        type="purchase"
        totem={baseTotem}
        innateTraitId="trt_does_not_exist"
        onClose={() => {}}
      />
    );
    expect(screen.queryByTitle(/Born trait:/)).not.toBeInTheDocument();
  });
});
