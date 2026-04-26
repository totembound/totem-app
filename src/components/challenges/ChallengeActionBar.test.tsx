import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import ChallengeActionBar from './ChallengeActionBar';

const base = {
  score: 1500,
  timeLeft: 12.3,
  onStart: vi.fn(),
  onRestart: vi.fn(),
};

describe('ChallengeActionBar', () => {

  describe('ready state', () => {
    it('renders start button with default label', () => {
      render(<ChallengeActionBar {...base} gameState="ready" />);
      expect(screen.getByRole('button', { name: 'Start Challenge' })).toBeInTheDocument();
    });

    it('renders start button with custom startLabel', () => {
      render(<ChallengeActionBar {...base} gameState="ready" startLabel="Start Rhythm Game" />);
      expect(screen.getByRole('button', { name: 'Start Rhythm Game' })).toBeInTheDocument();
    });

    it('calls onStart when clicked', async () => {
      const onStart = vi.fn();
      render(<ChallengeActionBar {...base} gameState="ready" onStart={onStart} />);
      await userEvent.click(screen.getByRole('button', { name: 'Start Challenge' }));
      expect(onStart).toHaveBeenCalledOnce();
    });
  });

  describe('playing state', () => {
    it('renders a disabled status button', () => {
      render(<ChallengeActionBar {...base} gameState="playing" />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('displays time and score', () => {
      render(<ChallengeActionBar {...base} gameState="playing" timeLeft={12.3} score={1500} />);
      expect(screen.getByRole('button')).toHaveTextContent('12.3s');
      expect(screen.getByRole('button')).toHaveTextContent('1500');
    });

    it('shows - when timeLeft is null', () => {
      render(<ChallengeActionBar {...base} gameState="playing" timeLeft={null} />);
      expect(screen.getByRole('button')).toHaveTextContent('-s');
    });

    it('renders extraStats between Time and Score', () => {
      render(
        <ChallengeActionBar
          {...base}
          gameState="playing"
          extraStats={<>| Attempts: 3</>}
        />
      );
      const text = screen.getByRole('button').textContent ?? '';
      expect(text.indexOf('Time:')).toBeLessThan(text.indexOf('Attempts:'));
      expect(text.indexOf('Attempts:')).toBeLessThan(text.indexOf('Score:'));
    });

    it('does not render a restart button', () => {
      render(<ChallengeActionBar {...base} gameState="playing" />);
      expect(screen.queryByRole('button', { name: /again/i })).not.toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('renders restart button with default label', () => {
      render(<ChallengeActionBar {...base} gameState="success" />);
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('renders restart button with custom restartLabel', () => {
      render(<ChallengeActionBar {...base} gameState="success" restartLabel="Play Again" />);
      expect(screen.getByRole('button', { name: 'Play Again' })).toBeInTheDocument();
    });

    it('restart button has green styling', () => {
      render(<ChallengeActionBar {...base} gameState="success" />);
      expect(screen.getByRole('button', { name: 'Try Again' })).toHaveClass('bg-green-600');
    });

    it('calls onRestart when clicked', async () => {
      const onRestart = vi.fn();
      render(<ChallengeActionBar {...base} gameState="success" onRestart={onRestart} />);
      await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      expect(onRestart).toHaveBeenCalledOnce();
    });

    it('displays score in the ticker', () => {
      render(<ChallengeActionBar {...base} gameState="success" score={2400} />);
      expect(screen.getByText(/2400/)).toBeInTheDocument();
    });
  });

  describe('failed state', () => {
    it('renders restart button', () => {
      render(<ChallengeActionBar {...base} gameState="failed" />);
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('restart button has red styling', () => {
      render(<ChallengeActionBar {...base} gameState="failed" />);
      expect(screen.getByRole('button', { name: 'Try Again' })).toHaveClass('bg-red-600');
    });

    it('calls onRestart when clicked', async () => {
      const onRestart = vi.fn();
      render(<ChallengeActionBar {...base} gameState="failed" onRestart={onRestart} />);
      await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      expect(onRestart).toHaveBeenCalledOnce();
    });
  });

});
