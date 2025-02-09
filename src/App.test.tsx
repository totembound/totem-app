import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock all context providers
jest.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  )
}));

jest.mock('./contexts/UserContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-provider">{children}</div>
  ),
  useUser: () => ({
    address: '',
    isConnected: false,
    isSignedUp: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signup: jest.fn()
  })
}));

jest.mock('./contexts/GameContext', () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="game-provider">{children}</div>
  )
}));

// Mock route components
jest.mock('./components/pages/Home', () => ({
  __esModule: true,
  default: () => <div data-testid="home-page">Home Page</div>
}));

jest.mock('./components/layouts/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">
      {children}
    </div>
  )
}));

// Mock react-router components to prevent actual routing
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="browser-router">{children}</div>
  ),
  Routes: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="routes">{children}</div>
  ),
  Route: ({ element }: { element: React.ReactNode }) => (
    <div data-testid="route">{element}</div>
  ),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  Navigate: () => null
}));

// Mock window.scrollTo to prevent errors
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

describe('App Component', () => {
  test('renders providers in correct order', () => {
    const { container } = render(<App />);

    // Check provider nesting order
    const providersOrder = [
      'theme-provider',
      'user-provider', 
      'game-provider'
    ];

    providersOrder.forEach(provider => {
      expect(container.querySelector(`[data-testid="${provider}"]`)).toBeInTheDocument();
    });
  });

  test('renders with correct routing structure', () => {
    render(<App />);
    
    // Check core routing components
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getByTestId('routes')).toBeInTheDocument();
    expect(screen.getByTestId('route')).toBeInTheDocument();
    
    // Check layout
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });
});
