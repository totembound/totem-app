import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar } from './Avatar';
import { Domain } from '../../types/types';

describe('<Avatar />', () => {
    it('renders an <img> for a domain avatar', () => {
        render(<Avatar avatar={{ kind: 'domain', id: Domain.Air }} displayName="Player" />);
        const img = screen.getByRole('img', { name: /Player avatar/i });
        expect(img).toHaveAttribute('src', '/domains/air-domain.jpg');
    });

    it('renders an <img> for a totem avatar', () => {
        render(<Avatar
            avatar={{ kind: 'totem', speciesId: 0, colorId: 0, stage: 0 }}
            displayName="Player"
        />);
        expect(screen.getByRole('img', { name: /Player avatar/i })).toBeInTheDocument();
    });

    it('renders initials when avatar is null', () => {
        render(<Avatar avatar={null} displayName="Cool Player" />);
        expect(screen.getByText('CP')).toBeInTheDocument();
    });

    it('renders "?" for empty displayName when avatar is null', () => {
        render(<Avatar avatar={null} displayName="" />);
        expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('applies the requested size class', () => {
        render(<Avatar avatar={null} displayName="Player" size="xl" />);
        // The xl size renders w-32 h-32 (128px) — read it via the aria-labelled element.
        const span = screen.getByLabelText('Player avatar');
        expect(span.className).toContain('w-32');
        expect(span.className).toContain('h-32');
    });
});
