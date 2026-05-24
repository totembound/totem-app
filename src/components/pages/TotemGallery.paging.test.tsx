import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS — same context wiring as TotemGallery.test.tsx, but the REAL
// GalleryToolbar + Pagination are rendered so paging behavior is exercised
// end-to-end (select -> state -> slice -> localStorage).
// ============================================================================

const mockUserContext = vi.hoisted(() => ({
    totems: [] as any[],
    totemLoading: false,
    totemError: null as string | null,
    fetchTotems: vi.fn(),
    updateTotemAttributes: vi.fn(),
}));

vi.mock('../../contexts/UserContext', () => ({ useUser: () => mockUserContext }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock('../../contexts/GameContext', () => ({
    useGame: () => ({
        isTotemAvailable: vi.fn().mockReturnValue(true),
        expeditionState: { userExpeditions: [] as any[] },
    }),
}));
vi.mock('react-router-dom', () => ({ useLocation: () => ({ state: null }) }));
vi.mock('../../utils/species', () => ({ getTotemImageUrl: () => '/test-image.png' }));
vi.mock('./TotemGalleryStats', () => ({ default: () => <div data-testid="stats" /> }));
vi.mock('../TotemDetailView', () => ({ default: () => <div data-testid="detail-view" /> }));
vi.mock('../TotemGridAndListView', () => ({
    TotemGridCard: () => <div data-testid="grid-card" />,
    TotemListRow: () => <div data-testid="list-row" />,
}));

import TotemGallery from './TotemGallery';

const STORAGE_KEY = 'totem-gallery-page-size';

const makeTotems = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        id: `ttm_${String(i + 1).padStart(2, '0')}`,
        displayName: `Totem ${i + 1}`,
        image: '/x.png',
        affinity: 'fire',
        domain: 'forest',
        attributes: {
            species: 0, color: 0, rarity: 0,
            happiness: 50, experience: 100, stage: 0,
            strength: 1, agility: 1, wisdom: 1,
            nickname: null, prestigeLevel: 0,
        },
        traits: {},
    })) as any[];

const cardCount = () => screen.getAllByTestId('grid-card').length;
const pageSizeSelect = () =>
    screen.getByRole('combobox', { name: /totems per page/i }) as HTMLSelectElement;

// The page indicator span ("1 / 2") sits between the prev/next chevron buttons.
const pager = () => {
    const indicator = screen.getByText(
        (_, el) => el?.tagName === 'SPAN' && /^\d+\s*\/\s*\d+$/.test(el.textContent || '')
    );
    const box = indicator.parentElement as HTMLElement;
    const [prev, next] = Array.from(box.querySelectorAll('button'));
    return { indicator, prev, next };
};

describe('TotemGallery paging', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockUserContext.totems = [];
        mockUserContext.totemLoading = false;
        mockUserContext.totemError = null;
    });

    it('defaults to "All" and renders the whole list on one page', () => {
        mockUserContext.totems = makeTotems(13);
        render(<TotemGallery />);

        expect(pageSizeSelect().value).toBe('-1');
        expect(cardCount()).toBe(13);
        expect(pager().indicator.textContent).toBe('1 / 1');
    });

    it('ignores an out-of-range stored preference and falls back to the default (All)', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(7)); // 7 is not an offered option
        mockUserContext.totems = makeTotems(13);
        render(<TotemGallery />);

        // Guard worked: shows all 13 (not 7) and the select sits on "All".
        expect(pageSizeSelect().value).toBe('-1');
        expect(cardCount()).toBe(13);
    });

    it('restores a valid stored preference', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(12));
        mockUserContext.totems = makeTotems(13);
        render(<TotemGallery />);

        expect(pageSizeSelect().value).toBe('12');
        expect(cardCount()).toBe(12); // first page of 12
    });

    it('re-slices and persists the choice when the page size changes', () => {
        mockUserContext.totems = makeTotems(13);
        render(<TotemGallery />);

        fireEvent.change(pageSizeSelect(), { target: { value: '12' } });

        expect(cardCount()).toBe(12);
        expect(pager().indicator.textContent).toBe('1 / 2');
        expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(12));
    });

    it('resets to page 1 when the page size changes', () => {
        mockUserContext.totems = makeTotems(13);
        render(<TotemGallery />);

        // Drop to 12/page (2 pages) and walk to page 2.
        fireEvent.change(pageSizeSelect(), { target: { value: '12' } });
        fireEvent.click(pager().next);
        expect(pager().indicator.textContent).toBe('2 / 2');
        expect(cardCount()).toBe(1);

        // Changing size must snap back to page 1, not leave us stranded on page 2.
        fireEvent.change(pageSizeSelect(), { target: { value: '24' } });
        expect(pager().indicator.textContent).toBe('1 / 1');
        expect(cardCount()).toBe(13);
    });

    it('collapses to a single page when "All" is selected', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(12));
        mockUserContext.totems = makeTotems(13);
        render(<TotemGallery />);
        expect(cardCount()).toBe(12);

        fireEvent.change(pageSizeSelect(), { target: { value: '-1' } });
        expect(cardCount()).toBe(13);
        expect(pager().indicator.textContent).toBe('1 / 1');
        expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(-1));
    });

    it('paginates the list view with the same effective page size', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(12));
        mockUserContext.totems = makeTotems(13);
        render(<TotemGallery />);

        fireEvent.click(screen.getByRole('button', { name: 'List' }));

        expect(screen.queryAllByTestId('grid-card')).toHaveLength(0);
        expect(screen.getAllByTestId('list-row')).toHaveLength(12); // first page of 12
        expect(pager().indicator.textContent).toBe('1 / 2');
    });

    it('clamps the page back into range when the list shrinks', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(12));
        mockUserContext.totems = makeTotems(13);
        const { rerender } = render(<TotemGallery />);

        fireEvent.click(pager().next); // go to page 2 of 2
        expect(pager().indicator.textContent).toBe('2 / 2');

        // List shrinks to a single page's worth — page 2 no longer exists.
        mockUserContext.totems = makeTotems(5);
        rerender(<TotemGallery />);

        // Clamp effect snaps currentPage from 2 down to the new last page.
        expect(pager().indicator.textContent).toBe('1 / 1');
        expect(cardCount()).toBe(5);
    });
});
