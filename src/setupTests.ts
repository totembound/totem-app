import '@testing-library/jest-dom';
import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Configure Testing Library
configure({
  asyncUtilTimeout: 1000,
  computedStyleSupportsPseudoElements: false,
  defaultHidden: true,
  throwSuggestions: true,
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Suppress Node.js punycode deprecation warning
const originalEmitWarning = process.emitWarning;
process.emitWarning = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The `punycode` module is deprecated')) {
    return;
  }
  return originalEmitWarning.apply(process, args as any);
};

// Mock window.matchMedia for Vitest
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Suppress specific console warnings
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args) => {
    // Skip React 18 strict mode warnings
    if (args[0]?.includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
    // Skip act() warnings - these occur due to async state updates in providers
    if (args[0]?.includes('Warning: `ReactDOMTestUtils.act` is deprecated')) {
      return;
    }
    if (args[0]?.includes('Warning: An update to') && args[0]?.includes('inside a test was not wrapped in act')) {
      return;
    }
    originalError.call(console, ...args);
  };
  console.warn = (...args) => {
    // Skip act() warnings that appear as warnings
    if (args[0]?.includes('not wrapped in act')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock Turnstile component to prevent external script loading during tests
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: vi.fn().mockImplementation(({ onSuccess }: any) => {
    // Auto-trigger success for testing
    if (onSuccess) {
      setTimeout(() => onSuccess('mock-turnstile-token'), 0);
    }
    return null;
  })
}));

// Mock environment variables for tests
vi.mock('import.meta.env', () => ({
  VITE_API_URL: 'http://localhost:3001',
  VITE_VERSION: '0.0.1',
  VITE_TURNSTILE_SITE_KEY: 'test-key'
}));

// Mock fetch for static config files that are loaded during tests
const originalFetch = global.fetch;
global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  // Mock species index
  if (url.includes('/data/species/index.json')) {
    return Promise.resolve(new Response(JSON.stringify({
      species: []
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }

  // Pass through other requests
  return originalFetch(input, init);
}) as typeof fetch;