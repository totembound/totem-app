import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import ScoreMessages, { ScoreMessage } from './ScoreMessageEffect';

vi.useFakeTimers();

describe('ScoreMessages Component', () => {
  const messages: ScoreMessage[] = [
    { id: 1, value: 100, x: 50, y: 100, createdAt: Date.now() },
  ];

  test('renders message with correct value', () => {
    render(<ScoreMessages messages={messages} />);
    expect(screen.getByText('+100')).toBeInTheDocument();
  });

  test('fades out over time', async () => {
    const { rerender } = render(<ScoreMessages messages={messages} duration={1000} />);
    const message = screen.getByText('+100');

    expect(message).toHaveStyle('opacity: 1');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    rerender(<ScoreMessages messages={messages} duration={1000} />); // Force a re-render

    await waitFor(() => expect(message).toHaveStyle('opacity: 0.5'));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    rerender(<ScoreMessages messages={messages} duration={1000} />);

    await waitFor(() => expect(message).toHaveStyle('opacity: 0')); // Fully faded
  });
});
