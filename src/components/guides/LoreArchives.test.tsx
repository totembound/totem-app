import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LoreArchives from './LoreArchives';
import { TALES, MYTHIC_EVENTS, FACTIONS, ERAS } from '../../config/lore';

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoreArchives />
    </MemoryRouter>
  );

describe('LoreArchives', () => {
  it('renders the page header and epigraph', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Lore Archives/i })).toBeInTheDocument();
    expect(screen.getByText(/The world does not forget/i)).toBeInTheDocument();
  });

  it('renders one card per tale', () => {
    renderPage();
    // Every tale title renders as a heading (cards) and again in the atlas
    for (const tale of TALES) {
      expect(screen.getAllByText(tale.title).length).toBeGreaterThan(0);
    }
  });

  it('renders the five eras', () => {
    renderPage();
    for (const era of ERAS) {
      expect(screen.getAllByText(era.name).length).toBeGreaterThan(0);
    }
  });

  it('renders each mythic event', () => {
    renderPage();
    for (const ev of MYTHIC_EVENTS) {
      expect(screen.getAllByText(ev.name).length).toBeGreaterThan(0);
    }
  });

  it('renders each faction', () => {
    renderPage();
    for (const f of FACTIONS) {
      expect(
        screen.getAllByRole('heading', { name: new RegExp(f.name, 'i') }).length
      ).toBeGreaterThan(0);
    }
  });

  it('opens a modal when a tale card is clicked', async () => {
    renderPage();
    const firstTale = TALES[0];
    const cards = screen.getAllByRole('button', { name: new RegExp(firstTale.title, 'i') });
    await userEvent.click(cards[0]);

    const closeBtn = await screen.findByRole('button', { name: /close tale/i });
    expect(closeBtn).toBeInTheDocument();
    expect(screen.getByText(firstTale.body[0])).toBeInTheDocument();
  }, 15000);

  it('expands an event row to show linked sites', async () => {
    renderPage();
    const ev = MYTHIC_EVENTS[0];
    const btn = screen.getByRole('button', { name: new RegExp(ev.name, 'i') });
    await userEvent.click(btn);
    const panel = btn.closest('div')!.parentElement!;
    expect(within(panel).getByText(ev.summary)).toBeInTheDocument();
  });

  it('atlas links include query param for the map', () => {
    renderPage();
    const links = screen.getAllByRole('link');
    const mapLinks = links.filter((l) =>
      l.getAttribute('href')?.startsWith('/guides/codex/map?location=')
    );
    expect(mapLinks.length).toBeGreaterThan(0);
  });
});
