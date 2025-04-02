import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import ScoreMessages, { ScoreMessage } from './ScoreMessageEffect';

jest.useFakeTimers();

describe('ScoreMessages Component', () => {
  const messages: ScoreMessage[] = [
    { id: 1, value: 100, x: 50, y: 100, createdAt: Date.now() },
  ];

  test('renders message with correct value', () => {
    render(<ScoreMessages messages={messages} />);
    expect(screen.getByText('+100')).toBeInTheDocument();
  });

  test('fades out over time', async () => {
    const { getByText, rerender } = render(<ScoreMessages messages={messages} duration={1000} />);
    const message = getByText('+100');

    expect(message).toHaveStyle('opacity: 1');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender(<ScoreMessages messages={messages} duration={1000} />); // Force a re-render

    await waitFor(() => expect(message).toHaveStyle('opacity: 0.5'));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender(<ScoreMessages messages={messages} duration={1000} />);

    await waitFor(() => expect(message).toHaveStyle('opacity: 0')); // Fully faded
  });
});
