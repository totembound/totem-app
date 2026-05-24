import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Toolbar from './GalleryToolbar';

type Props = Parameters<typeof Toolbar>[0];

const makeProps = (overrides: Partial<Props> = {}): Props => ({
    viewMode: 'grid',
    setViewMode: vi.fn(),
    currentPage: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
    totalItems: 0,
    itemsPerPage: -1,
    pageSizeOptions: [12, 24, 48, 96, -1],
    onPageSizeChange: vi.fn(),
    filters: { species: '', rarity: '', stage: '', affinity: '', domain: '' },
    setFilters: vi.fn(),
    sortConfig: { key: 'created', direction: 'desc' },
    onSortChange: vi.fn(),
    ...overrides,
});

const renderToolbar = (overrides: Partial<Props> = {}) =>
    render(<Toolbar {...makeProps(overrides)} />);

describe('GalleryToolbar — page size selector', () => {
    it('renders every page-size option and shows the -1 sentinel as "All"', () => {
        renderToolbar();
        const select = screen.getByRole('combobox', { name: /totems per page/i });
        const labels = within(select).getAllByRole('option').map((o) => o.textContent);
        expect(labels).toEqual(['12 / page', '24 / page', '48 / page', '96 / page', 'All']);
    });

    it('reflects the current itemsPerPage as the selected value', () => {
        renderToolbar({ itemsPerPage: 24 });
        const select = screen.getByRole('combobox', { name: /totems per page/i }) as HTMLSelectElement;
        expect(select.value).toBe('24');
    });

    it('calls onPageSizeChange with a number when a finite size is chosen', () => {
        const onPageSizeChange = vi.fn();
        renderToolbar({ onPageSizeChange });
        fireEvent.change(screen.getByRole('combobox', { name: /totems per page/i }), { target: { value: '24' } });
        expect(onPageSizeChange).toHaveBeenCalledWith(24);
    });

    it('calls onPageSizeChange with -1 when "All" is chosen', () => {
        const onPageSizeChange = vi.fn();
        renderToolbar({ onPageSizeChange, itemsPerPage: 24 });
        fireEvent.change(screen.getByRole('combobox', { name: /totems per page/i }), { target: { value: '-1' } });
        expect(onPageSizeChange).toHaveBeenCalledWith(-1);
    });
});

describe('GalleryToolbar — mobile filter sheet', () => {
    it('closes when Apply Filters is pressed', () => {
        renderToolbar();
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        expect(screen.getByRole('heading', { name: 'Filter Totems' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
        expect(screen.queryByRole('heading', { name: 'Filter Totems' })).not.toBeInTheDocument();
    });

    it('clears filters and closes when Reset Filters is pressed', () => {
        const setFilters = vi.fn();
        renderToolbar({ setFilters, filters: { species: 'Goose', rarity: '', stage: '', affinity: '', domain: '' } });
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));
        expect(setFilters).toHaveBeenCalledWith({ species: '', rarity: '', stage: '', affinity: '', domain: '' });
        expect(screen.queryByRole('heading', { name: 'Filter Totems' })).not.toBeInTheDocument();
    });

    it('closes when tapping the dimmed area outside the sheet', () => {
        const { container } = renderToolbar();
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        expect(screen.getByRole('heading', { name: 'Filter Totems' })).toBeInTheDocument();

        // The overlay is the dimmed full-screen layer wrapping the sheet.
        const overlay = container.querySelector('.bg-black\\/50') as HTMLElement;
        expect(overlay).toBeTruthy();
        fireEvent.click(overlay);
        expect(screen.queryByRole('heading', { name: 'Filter Totems' })).not.toBeInTheDocument();
    });
});

describe('GalleryToolbar — mobile sort sheet', () => {
    it('closes when tapping the dimmed area outside the sheet', () => {
        const { container } = renderToolbar();
        fireEvent.click(screen.getByRole('button', { name: 'Sort' }));
        expect(screen.getByRole('heading', { name: 'Sort Totems' })).toBeInTheDocument();

        const overlay = container.querySelector('.bg-black\\/50') as HTMLElement;
        expect(overlay).toBeTruthy();
        fireEvent.click(overlay);
        expect(screen.queryByRole('heading', { name: 'Sort Totems' })).not.toBeInTheDocument();
    });
});

describe('GalleryToolbar — sheet accessibility', () => {
    it('exposes the filter sheet as a labelled modal dialog', () => {
        renderToolbar();
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        const dialog = screen.getByRole('dialog', { name: 'Filter Totems' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('moves focus to the close button when the filter sheet opens', () => {
        renderToolbar();
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        const dialog = screen.getByRole('dialog', { name: 'Filter Totems' });
        expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    });

    it('closes the filter sheet on Escape', () => {
        renderToolbar();
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        expect(screen.getByRole('dialog', { name: 'Filter Totems' })).toBeInTheDocument();

        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(screen.queryByRole('dialog', { name: 'Filter Totems' })).not.toBeInTheDocument();
    });

    it('closes the sort sheet on Escape', () => {
        renderToolbar();
        fireEvent.click(screen.getByRole('button', { name: 'Sort' }));
        expect(screen.getByRole('dialog', { name: 'Sort Totems' })).toBeInTheDocument();

        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(screen.queryByRole('dialog', { name: 'Sort Totems' })).not.toBeInTheDocument();
    });
});
