import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

type Props = Parameters<typeof Pagination>[0];

const setup = (overrides: Partial<Props> = {}) => {
    const onPageChange = vi.fn();
    const props: Props = {
        currentPage: 2,
        totalPages: 5,
        totalItems: 42,
        onPageChange,
        ...overrides,
    };
    const utils = render(<Pagination {...props} />);
    return { onPageChange, ...utils };
};

describe('Pagination', () => {
    it('shows the total-items label by default (not hidden)', () => {
        setup();
        const total = screen.getByText('42 Total');
        expect(total).toBeInTheDocument();
        expect(total.className).not.toContain('hidden');
    });

    it('hides the total-items label on mobile when compact', () => {
        setup({ compact: true });
        const total = screen.getByText('42 Total');
        // compact => hidden on mobile, revealed from the sm breakpoint up
        expect(total.className).toContain('hidden');
        expect(total.className).toContain('sm:inline');
    });

    it('disables the previous button on the first page', () => {
        setup({ currentPage: 1, totalPages: 5 });
        const [prev, next] = screen.getAllByRole('button');
        expect(prev).toBeDisabled();
        expect(next).not.toBeDisabled();
    });

    it('disables the next button on the last page', () => {
        setup({ currentPage: 5, totalPages: 5 });
        const [prev, next] = screen.getAllByRole('button');
        expect(prev).not.toBeDisabled();
        expect(next).toBeDisabled();
    });

    it('calls onPageChange with the adjacent page when navigating', () => {
        const { onPageChange } = setup({ currentPage: 2, totalPages: 5 });
        const [prev, next] = screen.getAllByRole('button');
        fireEvent.click(prev);
        expect(onPageChange).toHaveBeenCalledWith(1);
        fireEvent.click(next);
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('gives the icon-only buttons and page indicator accessible names', () => {
        setup({ currentPage: 2, totalPages: 5 });
        expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
        expect(screen.getByText('2 / 5')).toHaveAttribute('aria-label', 'Page 2 of 5');
    });
});
