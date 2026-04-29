import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ImagePickerDialog } from './ImagePickerDialog';
import { Domain } from '../../types/types';

describe('<ImagePickerDialog mode="banner" />', () => {
    const baseProps = {
        isOpen: true,
        mode: 'banner' as const,
        current: null,
        onClose: vi.fn(),
        onSave: vi.fn().mockResolvedValue(undefined),
    };

    it('does not render when closed', () => {
        render(<ImagePickerDialog {...baseProps} isOpen={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders all 6 domain tiles', () => {
        render(<ImagePickerDialog {...baseProps} />);
        // 6 domain images at /domains/*-domain.jpg
        const imgs = screen.getAllByRole('button').filter(b => b.getAttribute('aria-pressed') !== null);
        expect(imgs.length).toBe(6);
    });

    it('Save is disabled until a selection is made', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<ImagePickerDialog {...baseProps} onSave={onSave} />);
        const save = screen.getByRole('button', { name: /^Save$/ });
        expect(save).toBeDisabled();
    });

    it('saves the selected domain and closes', async () => {
const onSave = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();

        render(<ImagePickerDialog {...baseProps} onSave={onSave} onClose={onClose} />);

        const tiles = screen.getAllByRole('button').filter(b => b.getAttribute('aria-pressed') !== null);
        await userEvent.click(tiles[0]);

        const save = screen.getByRole('button', { name: /^Save$/ });
        await userEvent.click(save);

        expect(onSave).toHaveBeenCalledWith({ kind: 'domain', id: Domain.Air });
        expect(onClose).toHaveBeenCalled();
    });

    it('Remove banner button clears selection then saves null', async () => {
const onSave = vi.fn().mockResolvedValue(undefined);
        render(
            <ImagePickerDialog
                {...baseProps}
                current={{ kind: 'domain', id: Domain.Fire }}
                onSave={onSave}
            />,
        );

        await userEvent.click(screen.getByRole('button', { name: /Remove banner/i }));
        await userEvent.click(screen.getByRole('button', { name: /^Save$/ }));

        expect(onSave).toHaveBeenCalledWith(null);
    });

    it('ESC closes the dialog', () => {
        const onClose = vi.fn();
        render(<ImagePickerDialog {...baseProps} onClose={onClose} />);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    // Mask click-to-close is covered by manual MCP browser testing on the
    // canonical dialog pattern (see /home/dpatten/repos/CLAUDE.md). JSDOM has
    // trouble with the Tailwind `bg-black/30` class selector, so this is
    // intentionally not exercised in unit tests.
});

describe('<ImagePickerDialog mode="avatar" />', () => {
    const totems = [
        {
            id: 'ttm_1',
            displayName: 'Brown Goose',
            name: 'Brown Goose',
            description: '',
            image: '',
            affinity: 'Wisdom',
            domain: 'Water',
            attributes: {
                species: 0,
                color: 0,
                rarity: 0,
                happiness: 50,
                experience: 100,
                stage: 2, // user has reached stage 2
                strength: 0,
                agility: 0,
                wisdom: 0,
                nickname: null,
                prestigeLevel: 0,
            },
            trackings: {},
        } as any,
    ];

    const baseProps = {
        isOpen: true,
        mode: 'avatar' as const,
        current: null,
        totems,
        onClose: vi.fn(),
        onSave: vi.fn().mockResolvedValue(undefined),
    };

    it('shows Domains and My Totems tabs', () => {
        render(<ImagePickerDialog {...baseProps} />);
        expect(screen.getByRole('button', { name: 'Domains' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'My Totems' })).toBeInTheDocument();
    });

    it('My Totems tab shows owned totems and only stages ≤ current', async () => {
        render(<ImagePickerDialog {...baseProps} />);
        await userEvent.click(screen.getByRole('button', { name: 'My Totems' }));
        await userEvent.click(screen.getByRole('button', { name: /Brown Goose/i }));

        // 3 stage thumbnails visible (alt="Stage 0/1/2") — totem is at stage 2
        const stageImgs = screen.getAllByAltText(/^Stage \d$/);
        expect(stageImgs.length).toBe(3);
    });

    it('selecting a totem stage saves the right ref', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<ImagePickerDialog {...baseProps} onSave={onSave} />);

        await userEvent.click(screen.getByRole('button', { name: 'My Totems' }));
        await userEvent.click(screen.getByRole('button', { name: /Brown Goose/i }));
        const stageImgs = screen.getAllByAltText(/^Stage \d$/);
        await userEvent.click(stageImgs[1].closest('button')!);

        await userEvent.click(screen.getByRole('button', { name: /^Save$/ }));

        expect(onSave).toHaveBeenCalledWith({
            kind: 'totem',
            speciesId: 0,
            colorId: 0,
            stage: 1,
        });
    });
});
