import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import App from './App';

// Define provider prop types
type ProviderProps = {
  children: React.ReactNode;
};

// Mock the context hooks
jest.mock('./contexts/UserContext', () => ({
  UserProvider: ({ children }: ProviderProps) => children,
  useUser: () => ({
    address: '',
    isConnected: false,
    isSignedUp: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signup: jest.fn()
  })
}));

// Mock the GameProvider
jest.mock('./contexts/GameContext', () => ({
  GameProvider: ({ children }: ProviderProps) => children
}));

// Mock all child components with better accessibility
jest.mock('./components/SignupForm', () => ({
  SignupForm: () => (
    <div role="form" aria-label="Sign Up Form" data-testid="signup-form">
      Sign Up Form
    </div>
  )
}));

jest.mock('./components/GameControls', () => ({
  GameControls: () => (
    <div role="region" aria-label="Game Controls" data-testid="game-controls">
      Game Controls
    </div>
  )
}));

jest.mock('./components/TotemGallery', () => ({
  __esModule: true,
  default: () => (
    <div role="region" aria-label="Totem Gallery" data-testid="totem-gallery">
      Totem Gallery
    </div>
  )
}));

jest.mock('./components/Footer', () => ({
  __esModule: true,
  default: () => (
    <footer role="contentinfo" data-testid="footer">
      Footer Content
    </footer>
  )
}));

describe('App Component', () => {
  test('renders initial state correctly', async () => {
    // Mock console.log to prevent noise in test output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    let container: HTMLElement;
    
    await act(async () => {
      const rendered = render(<App />);
      container = rendered.container;
    });
    
    // Test main layout structure using class name contains
    const allClasses = Array.from(container!.querySelectorAll('*'))
      .map(element => element.className)
      .join(' ');
      
    // Check for presence of key layout classes
    expect(allClasses).toContain('min-h-screen');
    expect(allClasses).toContain('bg-gray-100');
    
    // Test component rendering using better queries
    expect(screen.getByRole('form', { name: /sign up form/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /game controls/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /totem gallery/i })).not.toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    
    // Verify console.log was called with expected state
    expect(consoleSpy).toHaveBeenCalledWith(
      'App Rendering - Detailed State:',
      expect.objectContaining({
        isConnected: false,
        address: '',
        isSignedUp: false,
        addressLength: 0,
        addressTrimmed: 'No Address'
      })
    );

    // Clean up
    consoleSpy.mockRestore();
  });
});